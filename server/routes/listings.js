import { Router } from "express";
import { getListingDetails } from "../tools/getListingDetails.js";
import { searchListings } from "../tools/searchListings.js";

const router = Router();

router.get("/", (req, res) => {
  const listings = searchListings(req.query);
  res.json(listings);
});

router.get("/:id", (req, res) => {
  const listing = getListingDetails({ id: req.params.id });

  if (!listing) {
    res.status(404).json({ error: "Listing not found." });
    return;
  }

  res.json(listing);
});

export default router;

