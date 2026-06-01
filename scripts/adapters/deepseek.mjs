import { loadEnv } from "../env.mjs";
import { requireEnv, timeoutSignal } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

export async function createDeepSeekJsonCompletion({
  messages,
  model = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-flash",
  maxTokens = 4200,
  temperature = 0.35
}) {
  const apiKey = requireEnv("DEEPSEEK_API_KEY");
  const response = await fetch(new URL("/chat/completions", baseUrl), {
    method: "POST",
    signal: timeoutSignal(Number(process.env.INDICA_DEEPSEEK_TIMEOUT_MS || 90000)),
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
      "user-agent": "Indica/0.1 explanation generation"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      stream: false
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepSeek completion failed ${response.status} ${response.statusText}: ${body.slice(0, 500)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek completion returned no message content.");

  return {
    payload,
    json: JSON.parse(content)
  };
}
