/**
 * Groq API helper — calls the chat completion endpoint directly.
 * Uses fetch instead of the SDK for maximum control over the request.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function chatCompletion(
  messages: GroqMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      max_tokens: options?.maxTokens ?? 500,
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[groq] API error:", res.status, body);
    throw new Error(`Groq API error ${res.status}: ${body}`);
  }

  const data: GroqResponse = await res.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty response");
  }

  return content.trim();
}
