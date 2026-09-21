import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import listingsRouter from "./routes/listings.js";
import lucieRouter from "./routes/lucie.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/listings", listingsRouter);
app.use("/api/lucie", lucieRouter);

app.use((req, res) => {
  res.status(404).json({ error: `No route found for ${req.method} ${req.path}` });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err.message);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(port, () => {
  console.log(`Lucie Marketplace API listening on http://localhost:${port}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn("Lucie AI is not connected. Create server/.env with OPENAI_API_KEY=...");
  }
});

