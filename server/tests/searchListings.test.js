import { test } from "node:test";
import assert from "node:assert/strict";
import { searchListings } from "../tools/searchListings.js";

test("returns all listings when called with no filters", () => {
  const results = searchListings({});
  assert.ok(results.length > 0);
});

test("query matches title, description, category, condition, location, and tags, case-insensitively", () => {
  const byTitle = searchListings({ query: "iphone" });
  assert.ok(byTitle.some((listing) => listing.title.includes("iPhone")));

  const byTitleUpper = searchListings({ query: "IPHONE" });
  assert.deepEqual(byTitleUpper.map((l) => l.id).sort(), byTitle.map((l) => l.id).sort());

  const byTag = searchListings({ query: "apple" });
  assert.ok(byTag.length > 0);
});

test("category filter is an exact, case-insensitive match", () => {
  const results = searchListings({ category: "phones" });
  assert.ok(results.length > 0);
  assert.ok(results.every((listing) => listing.category === "Phones"));
});

test("condition filter matches as a substring, case-insensitively", () => {
  const results = searchListings({ condition: "excellent" });
  assert.ok(results.length > 0);
  assert.ok(results.every((listing) => listing.condition.toLowerCase().includes("excellent")));
});

test("location filter matches as a substring, case-insensitively", () => {
  const results = searchListings({ location: "beirut" });
  assert.ok(results.length > 0);
  assert.ok(results.every((listing) => listing.location.toLowerCase().includes("beirut")));
});

test("minPrice and maxPrice enforce an inclusive range", () => {
  const results = searchListings({ minPrice: 100, maxPrice: 300 });
  assert.ok(results.length > 0);
  assert.ok(results.every((listing) => listing.price >= 100 && listing.price <= 300));
});

test("combining filters narrows results further (AND, not OR)", () => {
  const broad = searchListings({ category: "Phones" });
  const narrow = searchListings({ category: "Phones", maxPrice: 300 });
  assert.ok(narrow.length <= broad.length);
  assert.ok(narrow.every((listing) => listing.category === "Phones" && listing.price <= 300));
});

test("a query that matches nothing returns an empty array, not an error", () => {
  const results = searchListings({ query: "this-will-never-match-anything-xyz" });
  assert.deepEqual(results, []);
});

test("null filter values behave the same as omitted filters (strict-mode tool schema sends null for 'not specified')", () => {
  const withNulls = searchListings({
    query: null,
    category: null,
    minPrice: null,
    maxPrice: null,
    condition: null,
    location: null
  });
  const omitted = searchListings({});
  assert.deepEqual(withNulls.map((l) => l.id).sort(), omitted.map((l) => l.id).sort());
});

test("non-numeric price filters are ignored rather than crashing or excluding everything", () => {
  const results = searchListings({ minPrice: "not-a-number" });
  const unfiltered = searchListings({});
  assert.deepEqual(results.map((l) => l.id).sort(), unfiltered.map((l) => l.id).sort());
});
