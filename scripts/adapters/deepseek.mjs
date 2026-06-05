import { Agent } from "undici";
import { loadEnv } from "../env.mjs";
import { requireEnv, timeoutSignal } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

// Reasoning models (deepseek-v4-pro) can think silently for several minutes before
// emitting a non-streamed response. undici's default headers/body socket timeouts
// (5 min) abort that with ETIMEDOUT, so disable them and let the AbortSignal below
// be the sole, longer cap.
const dispatcher = new Agent({ headersTimeout: 0, bodyTimeout: 0 });

export async function createDeepSeekJsonCompletion({
  messages,
  model = process.env.INDICA_EXPLANATION_MODEL || "deepseek-v4-flash",
  maxTokens = 4200,
  temperature = 0.35,
  jsonRetries = 1
}) {
  const apiKey = requireEnv("DEEPSEEK_API_KEY");
  let currentMessages = messages;
  let lastPayload = null;
  let lastContent = "";
  let lastParseError = null;

  // Long non-streamed reasoning requests occasionally have the connection dropped
  // by the API/proxy (ECONNRESET / "terminated"). Retry the network call a few
  // times with backoff before giving up; the AbortSignal still caps total time.
  const netRetries = Number(process.env.INDICA_DEEPSEEK_NET_RETRIES || 3);
  // The drop can happen mid-body (during response.json()), not just on connect, so
  // the WHOLE request+read cycle is inside the retry. A non-OK HTTP status throws a
  // non-retryable error so we don't pointlessly re-send a 4xx.
  class ApiError extends Error {}
  async function postCompletion(body) {
    let lastErr;
    for (let net = 0; net <= netRetries; net += 1) {
      try {
        const response = await fetch(new URL("/chat/completions", baseUrl), {
          method: "POST",
          dispatcher,
          signal: timeoutSignal(Number(process.env.INDICA_DEEPSEEK_TIMEOUT_MS || 180000)),
          headers: {
            "authorization": `Bearer ${apiKey}`,
            "content-type": "application/json",
            "user-agent": "Indica/0.1 explanation generation"
          },
          body
        });
        if (!response.ok) {
          const text = await response.text();
          throw new ApiError(`DeepSeek completion failed ${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
        }
        return await response.json();
      } catch (error) {
        if (error instanceof ApiError) throw error;
        lastErr = error;
        if (net >= netRetries) break;
        await new Promise((resolve) => setTimeout(resolve, 2000 * (net + 1)));
        console.warn(`  deepseek network error (${error.cause?.code || error.message}); retry ${net + 1}/${netRetries}`);
      }
    }
    throw lastErr;
  }

  for (let attempt = 0; attempt <= jsonRetries; attempt += 1) {
    const payload = await postCompletion(JSON.stringify({
      model,
      messages: currentMessages,
      temperature: attempt === 0 ? temperature : 0,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      stream: false
    }));

    const content = payload?.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek completion returned no message content.");
    lastPayload = payload;
    lastContent = content;

    try {
      return {
        payload,
        json: JSON.parse(content)
      };
    } catch (error) {
      lastParseError = error;
      if (attempt >= jsonRetries) break;
      currentMessages = [
        ...messages,
        { role: "assistant", content },
        {
          role: "user",
          content: [
            "The previous response was invalid JSON and could not be parsed.",
            `Parser error: ${error.message}`,
            "Return the same object again as strict valid JSON only.",
            "Escape all newlines inside string values as \\n.",
            "Do not add markdown fences or commentary."
          ].join("\n")
        }
      ];
    }
  }

  const finishReason = lastPayload?.choices?.[0]?.finish_reason || "unknown";
  throw new Error(`DeepSeek completion returned invalid JSON (${finishReason}): ${lastParseError?.message}. Content starts: ${lastContent.slice(0, 500)}`);
}
