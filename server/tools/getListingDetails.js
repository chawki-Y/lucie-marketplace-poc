import { loadListings } from "./listingData.js";

export function getListingDetails({ id }) {
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return null;
  }

  return loadListings().find((listing) => listing.id === numericId) || null;
}

