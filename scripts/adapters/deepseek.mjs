import { loadEnv } from "../env.mjs";
import { requireEnv, timeoutSignal } from "../lib/source-http.mjs";

loadEnv();

const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

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

  for (let attempt = 0; attempt <= jsonRetries; attempt += 1) {
    const response = await fetch(new URL("/chat/completions", baseUrl), {
      method: "POST",
      signal: timeoutSignal(Number(process.env.INDICA_DEEPSEEK_TIMEOUT_MS || 180000)),
      headers: {
        "authorization": `Bearer ${apiKey}`,
        "content-type": "application/json",
        "user-agent": "Indica/0.1 explanation generation"
      },
      body: JSON.stringify({
        model,
        messages: currentMessages,
        temperature: attempt === 0 ? temperature : 0,
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
