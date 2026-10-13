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
SELECT
  'gpt-5.6',
  'Find me an iPhone under $500.',
  'I found two iPhones under $500: iPhone 13 128GB and iPhone 12 Mini 64GB.',
  966,
  141,
  1107,
  0.006684,
  '[1, 3]'::jsonb,
  '[{"name":"searchListings","arguments":{"query":"iPhone","category":"Phones","maxPrice":500}}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM lucie_usage_logs WHERE user_prompt = 'Find me an iPhone under $500.'
);

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
SELECT
  'gpt-5.6',
  'Show me laptops under $600.',
  'Here are three laptops under $600: Dell XPS 13, Lenovo ThinkPad T14, and HP Pavilion 15.',
  1082,
  187,
  1269,
  0.008068,
  '[6, 7, 8]'::jsonb,
  '[{"name":"searchListings","arguments":{"query":"laptop","category":"Computers","maxPrice":600}}]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM lucie_usage_logs WHERE user_prompt = 'Show me laptops under $600.'
);

