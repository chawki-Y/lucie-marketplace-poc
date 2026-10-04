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

