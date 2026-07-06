// Wrapper to run prose generation for the water-stress flagship with the reasoning model.
// Loads .env (the generator itself does not) and sets deepseek-v4-pro + generous token/timeout
// budgets, because the pro reasoning model returns empty content if these are too small.
// See memory: indica-deepseek-v4-pro-reasoning. Usage:
//   node scripts/run-water-gen.mjs --questions=q.env.water_stress [--dry-run] [--single-pass]
import { loadEnv } from "./env.mjs";
loadEnv();
process.env.INDICA_EXPLANATION_MODEL ||= "deepseek-v4-pro";
process.env.INDICA_EXPLANATION_MAX_TOKENS ||= "32000";
process.env.INDICA_EXPLANATION_COMPACT_MAX_TOKENS ||= "32000";
process.env.INDICA_PLAN_MAX_TOKENS ||= "12000";
process.env.INDICA_EDIT_MAX_TOKENS ||= "32000";
process.env.INDICA_DEEPSEEK_TIMEOUT_MS ||= "600000";
await import("./generate-explanations.mjs");
