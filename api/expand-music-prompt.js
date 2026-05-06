/**
 * Vercel Serverless Function
 * POST /api/expand-music-prompt
 *
 * Server-side Anthropic call (fixes browser CORS).
 * Requires: process.env.ANTHROPIC_API_KEY
 */

function setCors(res) {
  // Allow calling this API from GitHub Pages or any origin.
  // If you want to lock it down, replace "*" with your site origin.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: "Method not allowed" }));
    return;
  }

  const { userInput } = await readJson(req);
  const brief = typeof userInput === "string" ? userInput.trim() : "";

  const apiKey = process.env.ANTHROPIC_API_KEY || "";
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: "ANTHROPIC_API_KEY is not set" }));
    return;
  }

  try {
    const mod = await import("../expandMusicPrompt.js");
    const expanded = await mod.expandMusicPrompt(brief, apiKey);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, data: expanded }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: "Expansion failed" }));
  }
};

