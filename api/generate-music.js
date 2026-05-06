/**
 * Vercel Serverless Function
 * POST /api/generate-music
 *
 * Proxies music generation to Google Gemini Lyria Pro.
 * Requires: process.env.GEMINI_API_KEY
 */

const LYRIA_MODEL = "lyria-3-pro-preview";
const GEMINI_LYRIA_URL = `https://generativelanguage.googleapis.com/v1beta/models/${LYRIA_MODEL}:generateContent`;

const RISKY_TERMS = [
  /\blo[\s-]?fi\b/gi, /\bjazz\b/gi, /\bsoul\b/gi, /\bhip[\s-]?hop\b/gi,
  /\br&b\b/gi, /\bblues\b/gi, /\bfunk\b/gi, /\bbossa\s*nova\b/gi,
  /\bclassical\b/gi, /\bbaroque\b/gi, /\bflamenco\b/gi, /\bregga[e]?\b/gi,
  /\bcountry\b/gi, /\bmetal\b/gi, /\brock\b/gi, /\bpunk\b/gi,
  /\bdisco\b/gi, /\bhouse\b/gi, /\btechno\b/gi, /\bdrum\s*&\s*bass\b/gi,
];

function sanitizeForLyria(prompt) {
  let s = prompt;
  for (const re of RISKY_TERMS) s = s.replace(re, "instrumental");
  return s;
}

function stripTimestamps(text) {
  return text.replace(/\[\d+:\d+\s*-\s*\d+:\d+\][^\[]*/g, "").replace(/\s{2,}/g, " ").trim();
}

function buildLyriaPrompt(userPrompt, simplify = 0) {
  let safe = sanitizeForLyria(userPrompt);
  if (simplify >= 1) {
    const cutAt = safe.search(/\[\d+:\d+/);
    safe = (cutAt > 0 ? safe.slice(0, cutAt) : stripTimestamps(safe)).trim();
  }
  if (simplify >= 2) {
    const sentences = safe.match(/[^.!?\n]+[.!?\n]*/g) || [safe];
    safe = sentences.slice(0, 2).join(" ").trim();
  }
  const MAX = simplify > 0 ? 800 : 1200;
  const trimmed = safe.length > MAX ? safe.slice(0, MAX).replace(/[^.!?\n]*$/, "").trim() || safe.slice(0, MAX) : safe;
  return (
    "Compose an original instrumental focus music piece. No vocals, no lyrics. " +
    "Use only original, non-copyrighted acoustic and electronic textures. " +
    "Keep the energy steady and pleasant for concentration.\n\n" +
    trimmed
  );
}

function extractAudioB64(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  let fallback = null;
  for (const p of parts) {
    const inline = p?.inlineData || p?.inline_data;
    if (!inline?.data || String(inline.data).length < 64) continue;
    const mime = (inline.mimeType || inline.mime_type || "").toLowerCase();
    if (mime.includes("audio") || mime.includes("mpeg") || mime.includes("mp3")) return inline.data;
    if (!mime.startsWith("text/") && String(inline.data).length > 2000) fallback = inline.data;
  }
  return fallback;
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return {}; }
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
    return;
  }

  const { userPrompt = "" } = await readJson(req);
  const geminiKey = process.env.GEMINI_API_KEY || "";

  if (!geminiKey) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "GEMINI_API_KEY not set" }));
    return;
  }

  async function post(text) {
    const configs = [{ generationConfig: { responseModalities: ["AUDIO"] } }, {}];
    for (const extra of configs) {
      const body = { contents: [{ parts: [{ text }] }], ...extra };
      const r = await fetch(`${GEMINI_LYRIA_URL}?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (r.status !== 400) return { ok: r.ok, status: r.status, data };
    }
    return { ok: false, status: 400, data: {} };
  }

  try {
    let ok, status, data, b64;

    for (let simplify = 0; simplify <= 2; simplify++) {
      const text = buildLyriaPrompt(userPrompt, simplify);
      ({ ok, status, data } = await post(text));
      b64 = extractAudioB64(data);
      if (b64) break;
      if (!ok) break;
      const finishReason = data?.candidates?.[0]?.finishReason ?? data?.candidates?.[0]?.finish_reason;
      const finishMsg = String(data?.candidates?.[0]?.finishMessage ?? data?.candidates?.[0]?.finish_message ?? "");
      if (finishReason === "OTHER" || /copyright|copyrighted|rephrasing/i.test(finishMsg)) continue;
      break;
    }

    if (!ok) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: `Gemini ${status}`, detail: data }));
      return;
    }

    if (!b64) {
      const candidate = data?.candidates?.[0];
      const finishMsg = candidate?.finishMessage ?? candidate?.finish_message;
      const finishReason = candidate?.finishReason ?? candidate?.finish_reason;
      let error = "no audio returned";
      if (finishMsg) error = String(finishMsg).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
      else if (finishReason && finishReason !== "STOP") error = `Generation stopped (${finishReason})`;
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, audioBase64: b64 }));
  } catch (e) {
    console.error("generate-music error:", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "Music generation failed" }));
  }
};
