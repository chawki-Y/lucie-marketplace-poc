export const DEFAULT_LUCIE_MODEL = "gpt-5.6";

export function getLucieModel() {
  return process.env.OPENAI_MODEL || DEFAULT_LUCIE_MODEL;
}
