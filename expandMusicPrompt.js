/**
 * Neuro-informed functional focus music → Lyria-ready expansion (Anthropic Messages API).
 * Self-contained: pass API key at call time; safe fallback on network/parse errors.
 */

const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

/** Full system instructions: constraints are enforced in model output, not echoed to end users. */
export const NEURO_FOCUS_SYSTEM_PROMPT = `You are a world-class music director and producer. Your job is to take a short user
music brief and transform it into a detailed, production-ready prompt optimized for
Google Gemini Lyria Pro — a high-fidelity AI music generation model.

---

## STEP 1 — READ THE USER'S INTENT

First, determine what mode the user is in:

### FOCUS MODE (apply only when clearly indicated)
Trigger words: "study", "focus", "productivity", "concentration", "work", "coding",
"reading", "deep work", "background", "calm", "ambient", "sleep", "relax".

In Focus Mode: keep music calm, even-tempered, and non-distracting. No hooks,
no dramatic buildups, intensity ceiling 6/10, tempo 60–95 BPM.

### FREE MODE (default — everything else)
When the user describes a genre, mood, era, or feeling WITHOUT focus trigger words,
treat it as a creative music request. Deliver the authentic sound of that genre/mood
at full energy. Examples:
- "classic rock with nostalgia" → driving guitar riffs, full drums, powerful chorus build
- "80s synthwave" → pulsing analog synths, fat basslines, cinematic arpeggios
- "upbeat jazz" → swinging rhythm section, punchy brass, walking bass
- "epic battle orchestral" → full brass, heavy percussion, dramatic swells
- "melancholic indie folk" → fingerpicked guitar, intimate room, aching strings
- "energetic drum and bass" → fast breakbeats, sub-bass pressure, synth stabs

In Free Mode: match the authentic character of the genre fully. Use appropriate BPM,
energy, dynamics, and instrumentation for that style. Do NOT tone it down or
make it focus-safe unless asked.

---

## ABSOLUTE RULE — ZERO VOCALS (applies in ALL modes)

No vocals, lyrics, chanting, humming, spoken word, or voice of any kind.
This is the only hard constraint that applies regardless of user input.
If the user's brief implies vocal music, create the instrumental version of that style.

---

## COPYRIGHT SAFETY — MANDATORY IN ALL OUTPUTS

Lyria Pro will reject prompts containing copyrighted references. Always apply:

- Never name real artists, composers, bands, or musicians
- Never name real songs, albums, films, TV shows, or games
- Never describe a melody in a way that identifies a specific copyrighted work
- Cultural and regional names are safe ("Celtic", "Persian", "80s synth pop style")
- Translate any implied copyrighted reference into its acoustic/compositional equivalent

---

## LYRIA PRO PROMPT FORMAT

Use the timestamp structure for best results. Always 5 sections over 3 minutes.

Template:
"Total duration: 3 minutes. Tempo: XX BPM. Key: XX. Overall feel: [description].

[0:00 - 0:30] Intro: Intensity: X/10. [4–6 sentences: instruments, texture, rhythm, mood]
[0:30 - 1:10] Build: Intensity: X/10. [4–6 sentences]
[1:10 - 1:50] Core: Intensity: X/10. [4–6 sentences — peak energy of the track]
[1:50 - 2:30] Development: Intensity: X/10. [4–6 sentences]
[2:30 - 3:00] Outro: Intensity: X/10. [4–6 sentences — resolve naturally]

Instrumental only. No vocals. No lyrics. No chanting."

### Intensity guide by mode:
- Focus Mode: range 2–6/10 across all sections
- Free Mode: use the full range authentically (e.g. rock might go 3→5→8→7→4/10)

### Always in every section:
- Name specific instruments and their roles
- Describe rhythmic character and tempo feel
- Describe spatial/reverb qualities
- Describe the emotional atmosphere

---

## EXAMPLES

### Free Mode — "classic rock with nostalgia"
{
  "title": "Highway at Dusk",
  "short_description": "A warm, nostalgic instrumental rock piece. Overdriven guitar leads carry a bittersweet melody over a driving rhythm section, evoking open roads and fading summers.",
  "lyria_prompt": "Total duration: 3 minutes. Tempo: 118 BPM. Key: A major. Overall feel: Nostalgic, driving classic rock — warm and bittersweet, like a road trip in golden hour.\\n\\n[0:00 - 0:30] Intro: Intensity: 3/10. A clean electric guitar plays a simple, ringing arpeggio over a slow snare count-in. The bass guitar enters with a steady root-note pulse. The drum kit joins with a light hi-hat groove. The tone is open and anticipatory, evoking a long empty highway at dusk. Warm analog reverb on the guitar, close-miked drums.\\n\\n[0:30 - 1:10] Build: Intensity: 5/10. A second overdriven guitar enters playing sustained power chords. The rhythm section locks into a steady 4/4 rock groove with snare on 2 and 4. The lead guitar carries a simple, singable melodic phrase in the upper register — unhurried, emotionally resonant. The overall sound is full and warm but not yet at full power.\\n\\n[1:10 - 1:50] Core: Intensity: 8/10. Full band at peak energy. The lead guitar plays an expressive melodic solo with smooth bends and vibrato — nostalgic and yearning in character, never shredding. The rhythm section drives hard. A light Hammond organ pad enters underneath, adding warmth and depth. The sound is wide, powerful, and emotionally rich.\\n\\n[1:50 - 2:30] Development: Intensity: 6/10. The band drops slightly in intensity. The organ takes the melodic lead with a sustained phrase. Guitar moves to rhythm only. The drums simplify to a half-time feel. The mood shifts from driving to reflective — still warm, now more introspective.\\n\\n[2:30 - 3:00] Outro: Intensity: 3/10. The band gradually strips back. Bass and drums fade first. The clean guitar returns to the opening arpeggio, now alone with warm reverb. The final note rings out naturally and fades to silence.\\n\\nInstrumental only. No vocals. No lyrics. No chanting.",
  "negative_prompt": "vocals, lyrics, chanting, distorted noise, atonal passages, jarring cuts",
  "style_tags": ["classic rock", "nostalgia", "electric guitar", "driving", "warm"],
  "tempo_bpm": "118 BPM",
  "key": "A major",
  "cultural_origin": "American rock",
  "intensity_ceiling": "8/10",
  "session_length": "Single listen / mood piece"
}

### Focus Mode — "study music"
{
  "title": "Still Water",
  "short_description": "A calm, continuous ambient piece designed for deep focus. Soft piano and gentle string pads create an even, distraction-free soundscape.",
  "lyria_prompt": "Total duration: 3 minutes. Tempo: 72 BPM. Key: D major. Overall feel: Calm, steady, and non-distracting — gentle piano and string pads for sustained concentration.\\n\\n[0:00 - 0:30] Intro: Intensity: 2/10. A single piano plays slow, widely-spaced chord voicings with long sustain. The room is warm and quiet. No rhythm, no pulse — only texture and space. A soft string pad enters beneath, holding a single chord. The atmosphere is still and expansive.\\n\\n[0:30 - 1:10] Body: Intensity: 3/10. The piano develops a slow, unhurried melodic phrase — long notes, gentle movement, no hooks. Soft strings provide harmonic support underneath. A subtle low bass note grounds the texture. The groove is barely felt — steady but never driving.\\n\\n[1:10 - 1:50] Development: Intensity: 4/10. A second piano voice enters higher in the register, adding gentle counterpoint. The strings swell very slightly. A soft vibraphone accent marks occasional beats. Changes are imperceptible — the music evolves like shifting light.\\n\\n[1:50 - 2:30] Subtle Peak: Intensity: 5/10. The texture is at its fullest — piano, strings, and vibraphone together. The dynamic is moderate and even. No dramatic moments. The music feels full and complete without demanding attention.\\n\\n[2:30 - 3:00] Outro: Intensity: 2/10. Layers dissolve gently. The vibraphone stops. Strings fade. Only the solo piano remains, slowing to a final held chord that decays into silence.\\n\\nInstrumental only. No vocals. No lyrics. No chanting.",
  "negative_prompt": "vocals, lyrics, chanting, hooks, sudden dynamics, heavy percussion, dramatic builds",
  "style_tags": ["ambient", "focus", "piano", "strings", "calm"],
  "tempo_bpm": "72 BPM",
  "key": "D major",
  "cultural_origin": "Contemporary classical",
  "intensity_ceiling": "5/10",
  "session_length": "Designed for: 30–90 minute focus sessions"
}

---

## OUTPUT FORMAT

Return ONLY valid JSON. No explanation, no commentary, no preamble.

{
  "title": "Evocative, specific track title",
  "short_description": "1–2 sentences describing the feel and style for UI display",
  "lyria_prompt": "Full Lyria Pro prompt with all 5 timestamp sections",
  "negative_prompt": "vocals, lyrics, and anything that conflicts with the requested style",
  "style_tags": ["tag1", "tag2", "tag3", "tag4"],
  "tempo_bpm": "XX BPM",
  "key": "e.g. A major / D minor / E pentatonic",
  "cultural_origin": "e.g. American rock, Japanese, Persian, Electronic",
  "intensity_ceiling": "e.g. 8/10 (Free Mode) or 6/10 (Focus Mode)",
  "session_length": "e.g. Single listen / mood piece  OR  Designed for: 30–90 minute focus sessions"
}

---

## GUARDRAILS

- User asks for vocals → silently produce the instrumental version of that style
- Input is vague → make a creative, genre-appropriate best guess
- Two genres combined → blend them authentically
- Copyrighted reference implied → translate to acoustic/compositional equivalents only
- Cultural/regional style named → preserve it fully and authentically
- Every lyria_prompt must end with: "Instrumental only. No vocals. No lyrics. No chanting."
`;

/**
 * @typedef {{
 *   title: string,
 *   short_description: string,
 *   lyria_prompt: string,
 *   style_tags: string[],
 *   energy_curve: string,
 *   tempo_bpm_range: string,
 *   cultural_origin: string,
 *   avoid: string[],
 * }} ExpandedMusicPrompt
 */

/**
 * Documented JSON shape for tooling / docs (not sent to the API).
 * @type {ExpandedMusicPrompt}
 */
export const EXPANSION_JSON_SHAPE = {
  title: "",
  short_description: "",
  lyria_prompt: "",
  style_tags: [],
  energy_curve: "",
  tempo_bpm_range: "",
  cultural_origin: "",
  avoid: [],
};

function normalizeKey(apiKey) {
  if (apiKey == null) return "";
  let s = String(apiKey).trim().replace(/^﻿/, "");
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/^(ANTHROPIC_API_KEY|API\s*key|Key)\s*[:=]\s*/i, "").trim();
  s = s.replace(/\s/g, "");
  return s;
}

function buildFallback(userInput) {
  const raw = String(userInput || "").trim();
  const seed = raw || "instrumental focus textures";
  const shorty = seed.length > 56 ? `${seed.slice(0, 53)}…` : seed;
  return {
    title: shorty,
    short_description: "Instrumental focus session aligned to your brief—steady, seamless, study-safe.",
    lyria_prompt: [
      "Instrumental only. No vocals, no lyrics, no spoken word.",
      `Functional focus music rooted in: ${seed}.`,
      "Moderate tempo roughly 72 BPM, steady groove the listener can track without effort—avoid both sterile minimalism and rhythmic overload.",
      "Attention-neutral bed: pads and soft mid textures first; any melodic material remains blurred and secondary—no hooks, solos, or earworm lines.",
      "Dynamics stay even across the whole piece—no drops, swells, or cinematic peaks; if density shifts, it moves over many bars, imperceptibly.",
      "Form flows as one continuous river: a soft, clear opening layer; bodies of sound accrue and thin subtly every 30–60 seconds without section breaks or silence gaps.",
      "Layer lows for weight, mids for harmonic warmth, highs as airy detail; generous but natural space—width and gentle room without spotlight effects.",
      "Avoid sudden harmonic pivots, call-and-response gimmicks, percussion fills that punctuate attention, and any moment meant to surprise.",
      "Emotional tone: calm clarity and quiet alertness throughout.",
    ].join(" "),
    style_tags: ["instrumental", "focus", "study"],
    energy_curve: "Nearly flat: only microscopic lifts and fades over long spans.",
    tempo_bpm_range: "68-88 BPM",
    cultural_origin: /iran|persian|japan|indian|africa|nordic|celtic/i.test(seed) ? "Anchored to user hint (expanded when online)" : "Eclectic",
    avoid: ["vocals", "lyrics", "hooks", "sudden dynamics", "cinematic drops", "spotlight solos"],
  };
}

function stripCodeFences(t) {
  let s = String(t).trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  }
  return s;
}

function parseExpandedJson(text) {
  const cleaned = stripCodeFences(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice);
}

function normalizeExpanded(obj, userInput) {
  const fb = buildFallback(userInput);
  if (!obj || typeof obj !== "object") return fb;
  const out = { ...fb, ...obj };
  out.title = String(out.title || fb.title).trim() || fb.title;
  out.short_description = String(out.short_description || fb.short_description).trim() || fb.short_description;
  out.lyria_prompt = String(out.lyria_prompt || fb.lyria_prompt).trim() || fb.lyria_prompt;
  out.style_tags = Array.isArray(out.style_tags) ? out.style_tags.map(String).slice(0, 8) : fb.style_tags;
  out.energy_curve = String(out.energy_curve || fb.energy_curve).trim() || fb.energy_curve;
  out.tempo_bpm_range = String(out.tempo_bpm_range || fb.tempo_bpm_range).trim() || fb.tempo_bpm_range;
  out.cultural_origin = String(out.cultural_origin || fb.cultural_origin).trim() || fb.cultural_origin;
  out.avoid = Array.isArray(out.avoid) ? out.avoid.map(String).slice(0, 16) : fb.avoid;
  return out;
}

/**
 * Expand a short user brief into structured, Lyria-ready direction using Anthropic.
 *
 * @param {string} userInput
 * @param {string} apiKey - Anthropic API key (pass at runtime; never hard-code).
 * @param {{ signal?: AbortSignal, model?: string, maxTokens?: number }} [options]
 * @returns {Promise<ExpandedMusicPrompt>}
 */
export async function expandMusicPrompt(userInput, apiKey, options = {}) {
  const brief = String(userInput || "").trim();
  const key = normalizeKey(apiKey);
  if (!brief || !key) return buildFallback(userInput);

  const model = options.model || DEFAULT_ANTHROPIC_MODEL;
  const maxTokens = options.maxTokens ?? 4096;
  const signal = options.signal;

  try {
    const res = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0.6,
        system: NEURO_FOCUS_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `User's music style / brief (short):\n\n${brief}\n\nReturn only the JSON object as specified.`,
          },
        ],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn("expandMusicPrompt: Anthropic error", res.status, data);
      return buildFallback(userInput);
    }

    const block = Array.isArray(data?.content) ? data.content.find((c) => c.type === "text") : null;
    const rawText = block?.text != null ? String(block.text) : "";
    if (!rawText.trim()) return buildFallback(userInput);

    try {
      const parsed = parseExpandedJson(rawText);
      return normalizeExpanded(parsed, userInput);
    } catch (parseErr) {
      console.warn("expandMusicPrompt: JSON parse failed, using fallback", parseErr);
      return buildFallback(userInput);
    }
  } catch (e) {
    if (e?.name === "AbortError") throw e;
    console.warn("expandMusicPrompt: request failed, using fallback", e);
    return buildFallback(userInput);
  }
}
