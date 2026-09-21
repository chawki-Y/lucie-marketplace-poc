import { loadListings } from "./listingData.js";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function numberOrUndefined(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function searchListings(filters = {}) {
  const listings = loadListings();
  const query = normalize(filters.query || filters.q || filters.search);
  const category = normalize(filters.category);
  const condition = normalize(filters.condition);
  const location = normalize(filters.location);
  const minPrice = numberOrUndefined(filters.minPrice);
  const maxPrice = numberOrUndefined(filters.maxPrice);

  return listings.filter((listing) => {
    const searchableText = normalize([
      listing.title,
      listing.description,
      listing.category,
      listing.condition,
      listing.location,
      ...(listing.tags || [])
    ].join(" "));

    if (query && !searchableText.includes(query)) {
      return false;
    }

    if (category && normalize(listing.category) !== category) {
      return false;
    }

    if (condition && !normalize(listing.condition).includes(condition)) {
      return false;
    }

    if (location && !normalize(listing.location).includes(location)) {
      return false;
    }

    if (minPrice !== undefined && listing.price < minPrice) {
      return false;
    }

    if (maxPrice !== undefined && listing.price > maxPrice) {
      return false;
    }

    return true;
  });
}

