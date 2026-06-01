import { existsSync, readFileSync } from "node:fs";

export function loadEnv(path = ".env") {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;

    const key = trimmed.slice(0, equals).trim();
    let value = trimmed.slice(equals + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }

  applyAliases();
}

function applyAliases() {
  const aliases = {
    CDSAPI_KEY: ["COPERNICUS", "copernicus", "COPERNICUS_API_KEY"]
  };

  for (const [canonical, names] of Object.entries(aliases)) {
    if (process.env[canonical]) continue;
    const alias = names.find((name) => process.env[name]);
    if (alias) process.env[canonical] = process.env[alias];
  }
}
