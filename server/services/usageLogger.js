import { getPool } from "./db.js";

const DEFAULT_INPUT_RATE_PER_MILLION = 4;
const DEFAULT_OUTPUT_RATE_PER_MILLION = 20;

let tableReady = false;

function getRate(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function estimateCostUsd({ inputTokens, outputTokens }) {
  const inputRate = getRate("OPENAI_INPUT_RATE_PER_MILLION", DEFAULT_INPUT_RATE_PER_MILLION);
  const outputRate = getRate("OPENAI_OUTPUT_RATE_PER_MILLION", DEFAULT_OUTPUT_RATE_PER_MILLION);

  return (inputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate;
}

async function ensureUsageLogTable(pool) {
  if (tableReady) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lucie_usage_logs (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      model TEXT NOT NULL,
      user_prompt TEXT NOT NULL,
      response_preview TEXT,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      estimated_cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,
      product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      tools_called JSONB NOT NULL DEFAULT '[]'::jsonb
    );
  `);

  tableReady = true;
}

export async function logLucieUsage({
  model,
  userPrompt,
  responseText,
  inputTokens,
  outputTokens,
  totalTokens,
  products,
  toolsCalled
}) {
  const estimatedCostUsd = estimateCostUsd({ inputTokens, outputTokens });

  console.log(
    `Lucie request usage: ${inputTokens} input tokens, ${outputTokens} output tokens, estimated cost ~$${estimatedCostUsd.toFixed(4)}`
  );

  const pool = getPool();

  if (!pool) {
    return;
  }

  try {
    await ensureUsageLogTable(pool);
    await pool.query(
      `
        INSERT INTO lucie_usage_logs (
          model,
          user_prompt,
          response_preview,
          input_tokens,
          output_tokens,
          total_tokens,
          estimated_cost_usd,
          product_ids,
          tools_called
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
      `,
      [
        model,
        userPrompt,
        responseText.slice(0, 500),
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCostUsd,
        JSON.stringify((products || []).map((product) => product.id)),
        JSON.stringify(toolsCalled || [])
      ]
    );
  } catch (error) {
    console.error("Lucie usage log database write failed:", error.message);
  }
}

