import OpenAI from "openai";
import { getLucieModel } from "./aiConfig.js";
import { logLucieUsage } from "./usageLogger.js";
import { getListingDetails } from "../tools/getListingDetails.js";
import { searchListings } from "../tools/searchListings.js";

const SYSTEM_PROMPT = `
You are Lucie, a warm, concise marketplace shopping assistant inside MarketPlace.
Your primary job is to help users discover, compare, and narrow marketplace listings.
Use the marketplace tools whenever a user asks for products, prices, categories, budgets, locations, or recommendations.
Never invent listings. Recommend only listings returned by tools.
Keep responses conversational and brief. Explain why the recommended items fit the user's request.
Do not use Markdown formatting. Write plain chat text that looks clean in a simple message bubble.
If no listings fit, say so and suggest a practical adjustment.
`;

export const tools = [
  {
    type: "function",
    name: "searchListings",
    description: "Search the marketplace listings JSON data using product text, category, price, condition, and location filters.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        query: {
          type: ["string", "null"],
          description: "A product, keyword, brand, or need to search for."
        },
        category: {
          type: ["string", "null"],
          enum: ["Electronics", "Phones", "Computers", "Gaming", "Home", "Fashion", null],
          description: "Marketplace category to filter by."
        },
        minPrice: {
          type: ["number", "null"],
          description: "Minimum listing price in USD."
        },
        maxPrice: {
          type: ["number", "null"],
          description: "Maximum listing price in USD."
        },
        condition: {
          type: ["string", "null"],
          description: "Condition text such as Used, Excellent, Like New, or New."
        },
        location: {
          type: ["string", "null"],
          description: "Lebanese city or area, such as Beirut, Metn, Byblos, Tripoli, Baabda, Jounieh, or Zahle."
        }
      },
      required: ["query", "category", "minPrice", "maxPrice", "condition", "location"],
      additionalProperties: false
    }
  },
  {
    type: "function",
    name: "getListingDetails",
    description: "Get one marketplace listing by its ID.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The listing ID."
        }
      },
      required: ["id"],
      additionalProperties: false
    }
  }
];

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function parseArguments(rawArguments) {
  if (!rawArguments) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawArguments);
    const isPlainObject = parsed !== null && typeof parsed === "object" && !Array.isArray(parsed);
    return isPlainObject ? parsed : {};
  } catch {
    return {};
  }
}

export async function runToolCall(toolCall) {
  const args = parseArguments(toolCall.arguments);

  if (toolCall.name === "searchListings") {
    const listings = searchListings(args).slice(0, 6);
    return {
      output: {
        count: listings.length,
        listings
      },
      products: listings
    };
  }

  if (toolCall.name === "getListingDetails") {
    const listing = getListingDetails(args);
    return {
      output: {
        listing: listing || null
      },
      products: listing ? [listing] : []
    };
  }

  return {
    output: {
      error: `Unknown tool: ${toolCall.name}`
    },
    products: []
  };
}

function addUsageTotals(totalUsage, usage = {}) {
  return {
    inputTokens: totalUsage.inputTokens + (usage.input_tokens || 0),
    outputTokens: totalUsage.outputTokens + (usage.output_tokens || 0),
    totalTokens: totalUsage.totalTokens + (usage.total_tokens || 0)
  };
}

async function finishLucieResponse({ model, messages, message, products, toolsCalled, totalUsage }) {
  const lastUserMessage = [...messages].reverse().find((item) => item.role === "user");

  await logLucieUsage({
    model,
    userPrompt: lastUserMessage?.content || "",
    responseText: message,
    inputTokens: totalUsage.inputTokens,
    outputTokens: totalUsage.outputTokens,
    totalTokens: totalUsage.totalTokens,
    products,
    toolsCalled
  });

  return {
    message,
    products
  };
}

export async function chatWithLucie(messages, { client: injectedClient } = {}) {
  const client = injectedClient || getOpenAIClient();

  if (!client) {
    console.warn("Lucie AI request skipped. Create server/.env with OPENAI_API_KEY=...");
    return {
      message: "Lucie isn't connected to the AI service yet. Add your OpenAI API key in server/.env, then restart the backend.",
      products: []
    };
  }

  // Only the most recent round's tool results are shown as product cards —
  // earlier rounds (e.g. a broad search the model then narrowed) are stale
  // by the time Lucie writes her final answer.
  let latestProducts = new Map();
  const toolsCalled = [];
  let totalUsage = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };
  const model = getLucieModel();
  let input = messages.map((message) => ({
    role: message.role,
    content: message.content.trim()
  }));

  for (let step = 0; step < 3; step += 1) {
    const response = await client.responses.create({
      model,
      instructions: SYSTEM_PROMPT,
      input,
      tools,
      tool_choice: "auto"
    });

    totalUsage = addUsageTotals(totalUsage, response.usage);
    const functionCalls = response.output.filter((item) => item.type === "function_call");

    if (functionCalls.length === 0) {
      return finishLucieResponse({
        model,
        messages,
        message: response.output_text || "I can help you search the marketplace. What are you looking for?",
        products: Array.from(latestProducts.values()).slice(0, 4),
        toolsCalled,
        totalUsage
      });
    }

    input = input.concat(response.output);

    const roundProducts = new Map();
    for (const toolCall of functionCalls) {
      const result = await runToolCall(toolCall);
      toolsCalled.push({
        name: toolCall.name,
        arguments: parseArguments(toolCall.arguments)
      });

      result.products.forEach((product) => {
        roundProducts.set(product.id, product);
      });

      input.push({
        type: "function_call_output",
        call_id: toolCall.call_id,
        output: JSON.stringify(result.output)
      });
    }
    latestProducts = roundProducts;
  }

  return finishLucieResponse({
    model,
    messages,
    message: "I found a few marketplace options that may help. Here are the strongest matches from the listings.",
    products: Array.from(latestProducts.values()).slice(0, 4),
    toolsCalled,
    totalUsage
  });
}
