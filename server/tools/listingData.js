import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const listingsPath = path.resolve(__dirname, "../data/listings.json");

export function loadListings() {
  const rawListings = fs.readFileSync(listingsPath, "utf8");
  return JSON.parse(rawListings);
}

