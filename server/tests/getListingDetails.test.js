import { test } from "node:test";
import assert from "node:assert/strict";
import { getListingDetails } from "../tools/getListingDetails.js";

test("returns the matching listing for a valid numeric id", () => {
  const listing = getListingDetails({ id: 1 });
  assert.ok(listing);
  assert.equal(listing.id, 1);
});

test("accepts a numeric string id, since tool arguments arrive as parsed JSON", () => {
  const listing = getListingDetails({ id: "1" });
  assert.ok(listing);
  assert.equal(listing.id, 1);
});

test("returns null for an id that does not exist", () => {
  const listing = getListingDetails({ id: 999999 });
  assert.equal(listing, null);
});

test("returns null, not a throw, for a non-numeric id", () => {
  assert.doesNotThrow(() => getListingDetails({ id: "not-a-number" }));
  assert.equal(getListingDetails({ id: "not-a-number" }), null);
});

test("returns null, not a throw, when id is missing entirely", () => {
  assert.doesNotThrow(() => getListingDetails({}));
  assert.equal(getListingDetails({}), null);
});
