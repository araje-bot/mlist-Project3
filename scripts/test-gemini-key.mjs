#!/usr/bin/env node
/**
 * Validates a Gemini API key with a tiny generateContent call (not Lyria).
 * Usage (never commit your key):
 *   GEMINI_API_KEY="your-key" node scripts/test-gemini-key.mjs
 */
const key = process.env.GEMINI_API_KEY?.trim();
if (!key) {
  console.error("Set GEMINI_API_KEY in the environment, then run again.");
  process.exit(1);
}

const url =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": key,
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Reply with exactly the word "OK".' }] }],
  }),
});

const data = await res.json().catch(() => ({}));
console.log("HTTP status:", res.status);
if (!res.ok) {
  console.error("API error:", data?.error?.message || JSON.stringify(data).slice(0, 500));
  process.exit(1);
}
const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
console.log("Key is valid. Model reply:", text || "(empty)");
