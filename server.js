
const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");

const PORT = 5500;
const ROOT = __dirname;

// --- Load .env (no external deps needed) ---
function loadEnv() {
  try {
    const raw = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const k = trimmed.slice(0, eq).trim();
      let v = trimmed.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    // .env missing — rely on real env vars
  }
}
loadEnv();

// --- MIME types ---
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "audio/ogg",
};

// --- Lyria music generation proxy ---
const LYRIA_MODEL = "lyria-3-pro-preview";
const GEMINI_LYRIA_URL = `https://generativelanguage.googleapis.com/v1beta/models/${LYRIA_MODEL}:generateContent`;

// Genre/style names that reliably trigger Lyria's copyright filter
const RISKY_TERMS = [
  /\blo[\s-]?fi\b/gi, /\bjazz\b/gi, /\bsoul\b/gi, /\bhip[\s-]?hop\b/gi,
  /\br&b\b/gi, /\bblues\b/gi, /\bfunk\b/gi, /\bbossa\s*nova\b/gi,
  /\bclassical\b/gi, /\bbaroque\b/gi, /\bflamenco\b/gi, /\bregga[e]?\b/gi,
  /\bcountry\b/gi, /\bmetal\b/gi, /\brock\b/gi, /\bpunk\b/gi,
  /\bdisco\b/gi, /\bhouse\b/gi, /\btechno\b/gi, /\bdrum\s*&\s*bass\b/gi,
];

function sanitizeForLyria(prompt) {
  let s = prompt;
  for (const re of RISKY_TERMS) {
    s = s.replace(re, "instrumental");
  }
  return s;
}

// Strip timestamp sections ([0:00 - 0:30] …) — these confuse Lyria's copyright filter
function stripTimestamps(text) {
  return text.replace(/\[\d+:\d+\s*-\s*\d+:\d+\][^\[]*/g, "").replace(/\s{2,}/g, " ").trim();
}

function buildLyriaPrompt(userPrompt, simplify = 0) {
  let safe = sanitizeForLyria(userPrompt);

  if (simplify >= 1) {
    // Strip timestamp sections — only keep text before the first [0:00 …] marker
    const cutAt = safe.search(/\[\d+:\d+/);
    safe = (cutAt > 0 ? safe.slice(0, cutAt) : stripTimestamps(safe)).trim();
  }
  if (simplify >= 2) {
    // Reduce to at most the first two sentences of whatever remains
    const sentences = safe.match(/[^.!?\n]+[.!?\n]*/g) || [safe];
    safe = sentences.slice(0, 2).join(" ").trim();
  }

  // Cap length: 800 chars on simplified retries, 1200 on first try
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

async function handleApiGenerateMusic(req, res) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  let userPrompt = "";
  try { userPrompt = JSON.parse(Buffer.concat(chunks).toString("utf8")).userPrompt || ""; } catch {}

  const geminiKey = process.env.GEMINI_API_KEY || "";
  if (!geminiKey) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "GEMINI_API_KEY not set in .env" }));
    return;
  }

  async function post(text) {
    // First try with the preferred config; fall through on 400
    const configs = [
      { generationConfig: { responseModalities: ["AUDIO"] } },
      {},
    ];
    for (const extra of configs) {
      const body = { contents: [{ parts: [{ text }] }], ...extra };
      const r = await fetch(`${GEMINI_LYRIA_URL}?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (r.status !== 400) return { ok: r.ok, status: r.status, data };
      console.log("[Lyria] 400 — config rejected, trying bare request");
    }
    return { ok: false, status: 400, data: {} };
  }

  try {
    let ok, status, data, b64;

    // Retry up to 3 times with progressively simpler prompts when copyright-blocked
    for (let simplify = 0; simplify <= 2; simplify++) {
      const text = buildLyriaPrompt(userPrompt, simplify);
      ({ ok, status, data } = await post(text));
      console.log("[Lyria] attempt simplify=" + simplify + " status:", status, "ok:", ok);
      console.log("[Lyria] finishReason:", data?.candidates?.[0]?.finishReason ?? data?.candidates?.[0]?.finish_reason);
      console.log("[Lyria] finishMessage:", String(data?.candidates?.[0]?.finishMessage ?? data?.candidates?.[0]?.finish_message ?? "").slice(0, 200));
      const parts0 = data?.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts0)) {
        parts0.forEach((p, i) => {
          const inline = p?.inlineData || p?.inline_data;
          console.log(`[Lyria] part[${i}] mime:`, inline?.mimeType ?? inline?.mime_type, "dataLen:", String(inline?.data ?? "").length);
        });
      } else {
        console.log("[Lyria] no content.parts — raw candidate:", JSON.stringify(data?.candidates?.[0] ?? null).slice(0, 400));
      }

      b64 = extractAudioB64(data);
      if (b64) break; // got audio — done

      if (!ok) break; // hard API error — stop retrying

      // Copyright/content filter → retry with simpler prompt
      const finishReason = data?.candidates?.[0]?.finishReason ?? data?.candidates?.[0]?.finish_reason;
      const finishMsg = String(data?.candidates?.[0]?.finishMessage ?? data?.candidates?.[0]?.finish_message ?? "");
      if (finishReason === "OTHER" || /copyright|copyrighted|rephrasing/i.test(finishMsg)) {
        console.log("[Lyria] copyright filter — retrying with simpler prompt (simplify=" + (simplify + 1) + ")");
        continue;
      }
      break; // unknown no-audio — stop cycling
    }

    if (!ok) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: `Gemini ${status}`, detail: data }));
      return;
    }

    if (!b64) {
      const candidate = data?.candidates?.[0];
      const finishMsg = candidate?.finishMessage ?? candidate?.finish_message;
      const finishReason = candidate?.finishReason ?? candidate?.finish_reason;
      let error = "no audio returned";
      if (finishMsg) {
        error = String(finishMsg).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
      } else if (finishReason && finishReason !== "STOP") {
        error = `Generation stopped (${finishReason})`;
      }
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, audioBase64: b64 }));
  } catch (e) {
    console.error("generate-music error:", e);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Music generation failed" }));
  }
}

// --- Anthropic expansion proxy ---
async function handleApiExpandMusic(req, res) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  let userInput = "";
  try {
    userInput = JSON.parse(raw).userInput || "";
  } catch {}

  const apiKey = process.env.ANTHROPIC_API_KEY || "";
  if (!apiKey) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "ANTHROPIC_API_KEY not set in .env" }));
    return;
  }

  try {
    // Dynamically import the shared module (ES module)
    const mod = await import("./expandMusicPrompt.js");
    const expanded = await mod.expandMusicPrompt(userInput, apiKey);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, data: expanded }));
  } catch (e) {
    console.error("API error:", e);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Expansion failed" }));
  }
}

// --- Static file handler ---
function handleStatic(req, res) {
  let urlPath = req.url.split("?")[0];
  if (urlPath === "/") urlPath = "/index.html";

  const filePath = path.join(ROOT, urlPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`Not found: ${urlPath}`);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    res.end(data);
  });
}

// --- Main server ---
const server = http.createServer(async (req, res) => {
  // CORS headers (for local dev convenience)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = req.url.split("?")[0];

  if (urlPath === "/api/expand-music-prompt") {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
      return;
    }
    await handleApiExpandMusic(req, res);
    return;
  }

  if (urlPath === "/api/generate-music") {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
      return;
    }
    await handleApiGenerateMusic(req, res);
    return;
  }

  handleStatic(req, res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  mList dev server running at http://127.0.0.1:${PORT}\n`);
  console.log(`  Anthropic key: ${process.env.ANTHROPIC_API_KEY ? "✓ loaded" : "✗ NOT SET — add ANTHROPIC_API_KEY to .env"}`);
});
