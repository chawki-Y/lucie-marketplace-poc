import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chatWithLucie,
  parseArguments,
  runToolCall,
  tools
} from "../services/lucieService.js";

function withoutExternalEnv(fn) {
  const savedKey = process.env.OPENAI_API_KEY;
  const savedDb = process.env.DATABASE_URL;
  delete process.env.OPENAI_API_KEY;
  delete process.env.DATABASE_URL;

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      if (savedKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = savedKey;
      if (savedDb === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = savedDb;
    });
}

function functionCall({ name, args, callId }) {
  return {
    type: "function_call",
    name,
    call_id: callId,
    arguments: JSON.stringify(args)
  };
}

// ---- parseArguments (fix: malformed/unexpected tool arguments should never crash) ----

test("parseArguments: valid JSON object string is parsed as-is", () => {
  assert.deepEqual(parseArguments('{"id":1}'), { id: 1 });
});

test("parseArguments: empty/falsy raw arguments become an empty object", () => {
  assert.deepEqual(parseArguments(""), {});
  assert.deepEqual(parseArguments(undefined), {});
});

test("parseArguments: malformed JSON becomes an empty object instead of throwing", () => {
  assert.doesNotThrow(() => parseArguments("{not valid json"));
  assert.deepEqual(parseArguments("{not valid json"), {});
});

test("parseArguments: a JSON literal 'null' becomes an empty object, not JS null", () => {
  // This is the exact case that used to crash getListingDetails: JSON.parse("null") === null,
  // and `const { id } = null` throws. parseArguments must never hand back a non-object.
  assert.deepEqual(parseArguments("null"), {});
});

test("parseArguments: a JSON array becomes an empty object, since tool args must be a plain object", () => {
  assert.deepEqual(parseArguments("[1,2,3]"), {});
});

// ---- runToolCall (integration: the null-arguments crash, end to end) ----

test("runToolCall: getListingDetails with raw arguments 'null' does not throw", async () => {
  const call = functionCall({ name: "getListingDetails", args: {}, callId: "call_1" });
  call.arguments = "null"; // simulate the exact malformed payload that used to crash
  await assert.doesNotReject(() => runToolCall(call));
  const result = await runToolCall(call);
  assert.equal(result.output.listing, null);
  assert.deepEqual(result.products, []);
});

test("runToolCall: searchListings with raw arguments 'null' does not throw and searches unfiltered", async () => {
  const call = functionCall({ name: "searchListings", args: {}, callId: "call_1" });
  call.arguments = "null";
  const result = await runToolCall(call);
  assert.ok(result.output.count > 0);
});

test("runToolCall: unknown tool name returns a soft error, not a throw", async () => {
  const call = functionCall({ name: "doSomethingDangerous", args: {}, callId: "call_1" });
  const result = await runToolCall(call);
  assert.match(result.output.error, /Unknown tool/);
  assert.deepEqual(result.products, []);
});

// ---- tool schema strict mode (fix: OpenAI should enforce argument shape itself) ----

test("tool schemas declare strict mode with additionalProperties disabled", () => {
  for (const tool of tools) {
    assert.equal(tool.strict, true, `${tool.name} should be strict`);
    assert.equal(tool.parameters.additionalProperties, false, `${tool.name} should disallow extra properties`);
  }
});

test("searchListings schema lists every property as required (strict mode requires this; optionality comes from nullable types)", () => {
  const searchTool = tools.find((tool) => tool.name === "searchListings");
  const propertyNames = Object.keys(searchTool.parameters.properties);
  assert.deepEqual([...searchTool.parameters.required].sort(), [...propertyNames].sort());

  for (const name of propertyNames) {
    const propertyType = searchTool.parameters.properties[name].type;
    assert.ok(propertyType.includes("null"), `${name} should accept null for "not specified"`);
  }
});

// ---- chatWithLucie: missing API key ----

test("chatWithLucie: returns the not-connected message and no products when OPENAI_API_KEY is unset", () =>
  withoutExternalEnv(async () => {
    const result = await chatWithLucie([{ role: "user", content: "hi" }]);
    assert.match(result.message, /isn't connected/);
    assert.deepEqual(result.products, []);
  }));

// ---- chatWithLucie: cross-round product accumulation (fix: only the latest round should be shown) ----

test("chatWithLucie: product cards reflect only the most recent tool-call round, not every round in the turn", () =>
  withoutExternalEnv(async () => {
    let callCount = 0;
    const mockClient = {
      responses: {
        create: async () => {
          callCount += 1;
          if (callCount === 1) {
            // Round 1: a broad search the model will go on to narrow.
            return {
              output: [functionCall({ name: "getListingDetails", args: { id: 1 }, callId: "call_1" })],
              usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
            };
          }
          if (callCount === 2) {
            // Round 2: the model narrows to a different listing.
            return {
              output: [functionCall({ name: "getListingDetails", args: { id: 2 }, callId: "call_2" })],
              usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
            };
          }
          // Round 3: final answer, no more tool calls.
          return {
            output: [],
            output_text: "Here is the best match.",
            usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
          };
        }
      }
    };

    const result = await chatWithLucie(
      [{ role: "user", content: "find me something, then something else" }],
      { client: mockClient }
    );

    assert.equal(callCount, 3);
    assert.equal(result.products.length, 1);
    assert.equal(result.products[0].id, 2, "should show round 2's listing, not round 1's stale one");
  }));

// ---- chatWithLucie: round limit ----

test("chatWithLucie: stops after 3 tool-call rounds and returns a safe fallback message", () =>
  withoutExternalEnv(async () => {
    let callCount = 0;
    const mockClient = {
      responses: {
        create: async () => {
          callCount += 1;
          // Always ask for another tool call — the model never produces a final answer.
          return {
            output: [functionCall({ name: "getListingDetails", args: { id: 1 }, callId: `call_${callCount}` })],
            usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 }
          };
        }
      }
    };

    const result = await chatWithLucie([{ role: "user", content: "keep searching forever" }], { client: mockClient });

    assert.equal(callCount, 3, "should stop at the round limit instead of looping forever");
    assert.match(result.message, /strongest matches/);
    assert.equal(result.products.length, 1);
    assert.equal(result.products[0].id, 1);
  }));
