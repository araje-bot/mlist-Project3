# Functional focus expansion — sample JSON outputs

Illustrative examples matching the schema produced by `expandMusicPrompt()` / `NEURO_FOCUS_SYSTEM_PROMPT`. Real Claude output will vary; use these as style references only.

---

## Schema (reference)

```json
{
  "title": "string",
  "short_description": "string",
  "lyria_prompt": "string (150–300 words)",
  "style_tags": ["tag1", "tag2", "tag3"],
  "energy_curve": "string",
  "tempo_bpm_range": "string",
  "cultural_origin": "string",
  "avoid": ["…"]
}
```

---

## 1. Input: `"iranian jazz"`

```json
{
  "title": "Quiet Bazaar, Still Hands",
  "short_description": "Persian-tinged instrumental jazz for study: tar and santur colors over a soft, even groove with no solos or hooks.",
  "lyria_prompt": "Instrumental only—no vocals, lyrics, or speech. Create a long-form functional focus piece that reads as Persian-influenced jazz without mimicking any artist. Anchor the harmony in modal colors that suggest dastgāh warmth but keep changes glacial—never a surprise cadence. Instruments: soft-setar or tar-like plucks deep in the bed, santur or zither as blurred, arpeggiated sparkle (never foregrounded), upright bass or synth bass walking very gently in a narrow dynamic range, brush-style drums or frame-drum pulse at roughly 76 BPM in 4/4 with no fills that punctuate attention, and wide stereo pads carrying air. The mix should feel like a sunlit room: low foundation, mid harmonic cushion, highs as dust in the light. Open with sparse layers; every 40–50 seconds let one new element appear or one harmonic shade shift by a semitone or mode inflection so subtly the listener cannot pinpoint the moment. Maintain continuous texture—no breaks, no drops, no A/B section seams. Dynamics stay level; do not swing from soft to loud. Melody, if any, is haze—not a tune you can hum. Explicitly avoid singing, chanting, spoken word, virtuosic solos, earworm motifs, cinematic swells, or sharp accents. Target emotional state: calm clarity and steady focus while the cultural identity remains unmistakably Persian-modern jazz.",
  "style_tags": ["persian-jazz", "instrumental-focus", "modal-ambient"],
  "energy_curve": "Flat calm with microscopic layer drift; no arc, only slow river motion.",
  "tempo_bpm_range": "74-82 BPM",
  "cultural_origin": "Persian / Iranian",
  "avoid": [
    "vocals",
    "lyrics",
    "melodic hooks",
    "drum fills",
    "dynamic jumps",
    "spotlight improvisations"
  ]
}
```

## 2. Input: `"japanese lofi"`

```json
{
  "title": "Rice-Paper Static",
  "short_description": "Tokyo-night lofi without vinyl gimmicks: clean instrumental bed, muted Rhodes, and rain-soft percussion for deep work.",
  "lyria_prompt": "Strictly instrumental; no vocals, humming leads, or sampled speech. Build a Japanese-flavored lofi study texture tuned for functional listening, not nostalgia bait. Tempo near 78 BPM with a brushed or rim-tap groove so steady it disappears into the body—no syncopated ear-catchers. Use electric piano or soft Rhodes in closed voicings, nylon or muted guitar as gentle mid bed, subtle koto or plucked equivalent only as distant detail, analog-style pads kept low-passed and wide, and a dusty-not-loud floor of soft bass. Spatially, place mid keys slightly forward and keep highs airy with a modest room reverb—nothing cavernous or cinematic. The piece never stops for a ‘beat switch’; evolve by slowly filtering harmonics or introducing a second pad an octave up over 45–60 seconds at a time. Reject sidechain pumping as a focal effect, reject meme drops, reject catchphrase loops. Harmony moves through gentle tertian colors—no sudden modulations. Blur any melodic idea into four-note cells that oscillate rather than develop tunefully. Overall emotional palette: gentle alertness, like working late with the window cracked. This is work music: continuous, kind, unobtrusive.",
  "style_tags": ["japanese-lofi", "study-instrumental", "steady-groove"],
  "energy_curve": "Almost level; density breathes in millimeter steps only.",
  "tempo_bpm_range": "74-86 BPM",
  "cultural_origin": "Japanese",
  "avoid": [
    "vocals",
    "lofi sample chatter",
    "pumping sidechain hooks",
    "beat drops",
    "memorable loops"
  ]
}
```

## 3. Input: `"indian classical"`

```json
{
  "title": "Saffron Drone Study",
  "short_description": "Hindustani-inspired instrumental bed: tanpura-like drones, soft tabla pulse, no vocal alaap, built for concentration.",
  "lyria_prompt": "Instrumental only—absolutely no singing, alaap, sargam, or spoken instruction. Honor Indian classical timbre and tuning with a patient drone layer that implies tanpura color, a subdued tabla or pakhawaj-like pulse at around 68 BPM in a steady theka pattern with zero showy bols or sudden tihais, and a warm melodic instrument such as bansuri or bowed strings kept deliberately understated—never a commanding rāga line, only breathy, meandering fragments that dissolve into the bed. Include a low sympathetic string or soft synth sub for weight. Harmony is implied by modal relationships, not Western cadences; evolution happens through micro-shifts of ornament every half-minute, not through structural drama. Stereo field: wide highs, centered low, mid texture slightly left-right staggered for envelopment. Maintain continuous sound—no pause between ‘movements.’ Dynamics are narrow; avoid climaxes. Explicitly forbid virtuosic soloistic display, call-and-response theatrics, or cadential bursts. Emotional goal: quiet confidence and sustained attention while the cultural essence remains clear.",
  "style_tags": ["hindustani-ambient", "drone-focus", "percussion-bed"],
  "energy_curve": "Steady drone envelope; tabla stays a heartbeat, not a narrator.",
  "tempo_bpm_range": "64-76 BPM",
  "cultural_origin": "Indian",
  "avoid": [
    "vocals",
    "alaap",
    "virtuosic solos",
    "dramatic tihais",
    "sudden tempo lifts"
  ]
}
```

## 4. Input: `"dark academic strings"`

```json
{
  "title": "Cipher in the Cordage",
  "short_description": "Moody string ensemble for reading—close, library-dry, but never gothic-cinematic or startling.",
  "lyria_prompt": "Instrumental strings only; no choir, vocals, or Latin text. Dark-academic atmosphere translates to muted chord pads played by small ensemble colors (viola/violin/cello ensembles) with very controlled bow pressure, avoiding heroic melodic tops. Tempo implied near 72 BPM via quietly pulsing eighths in the cellos while violas sustain modal harmony. Reverb is library-small, not cathedral epic; keep early reflections tight so the brain feels enclosed, not transported. Layer mid-register dyads and slow-moving clusters that evolve by half-step drifts across minutes—no thematic ‘tune.’ Dynamics restricted to a narrow band; crescendi take 90+ seconds if they exist at all. Strings must never burst into swells reminiscent of soundtrack trailers. Add faint wooden knocks or pencil-desk noise only if utterly buried and non-rhythmic—otherwise omit. Progression feels like turning pages: each minute adds or subtracts one strand of counterpoint at whisper level. Hard ban on fright cues, sudden pizzicato accents, dramatic key slams, or memorable four-note hooks. Emotional tone: studious seriousness without dread or euphoria.",
  "style_tags": ["chamber-strings", "dark-academic", "reading-ambient"],
  "energy_curve": "Subdued throughout; tension is intellectual, not sonic.",
  "tempo_bpm_range": "70-80 BPM",
  "cultural_origin": "Eclectic (Western classical chamber)",
  "avoid": [
    "vocals",
    "choir",
    "trailer swells",
    "sharp pizzicato shocks",
    "melodic hero lines"
  ]
}
```

## 5. Input: `"ambient piano for studying"`

```json
{
  "title": "Glass Desk Lid",
  "short_description": "Solo-adjacent piano ambience: blurred hammers, soft sustain, no singable melody.",
  "lyria_prompt": "Instrumental piano + subtle bed only—no singing, no spoken samples. Functional ambient for study: close-mic felt piano or muted upright, heavily low-passed for the first minutes, paired with a faint static pad or harmonic shimmer underneath. Tempo around 80 BPM exists only as implied pulse via sparse left-hand arpeggiation that never accents downbeats theatrically. Right hand plays voicing clusters and broken chords rather than melodies; if intervals suggest a line, keep it irregular enough to resist memorization. Use long, gentle sustain pedal blurs vetted so lows never turn muddy spikes. Spatially, mono-ish center for core piano with a halo reverb 15–20% wet, stereo only in the halo, not in rhythmic content. Every 35–45 seconds, imperceptibly lift treble air or add a harmonic partial in the pad—never announce the change. No fermatas, no bars of silence, no ‘chorus’ where chords suddenly widen for drama. Forbid chart-friendly chord loops, pop progressions that resolve satisfyingly, or walking melodic motifs. Emotional target: clean, hydrated calm—alert but unromantic.",
  "style_tags": ["ambient-piano", "study-focus", "minimal-harmony"],
  "energy_curve": "Flat mist with microscopic harmonic brightening.",
  "tempo_bpm_range": "76-90 BPM (felt, not pulsing dance)",
  "cultural_origin": "Eclectic",
  "avoid": [
    "vocals",
    "hooks",
    "pop chord loops",
    "dramatic pauses",
    "singable melodies"
  ]
}
```

## 6. Input: `"west african percussion"`

```json
{
  "title": "Laterite Pulse",
  "short_description": "Polyrhythmic yet study-safe percussion sculpture—steady cycle, no drum-circle climaxes.",
  "lyria_prompt": "Purely instrumental percussion ensemble invoking West African color without aping specific recordings—no vocals or chants. Establish a core bell or wood block ostinato near 78 BPM with light djembe-like tones kept mid-soft and compressed into a narrow dynamic window; add shaker layers, low tuned drums for body, and occasional hand drum touches that never break into flashy solos. Polyrhythms should interlock gently—complexity felt as texture, not math homework for the ear. Keep a continuous bed of very soft sub or bass drum warmth so the body locks in. Never stop the groove for a break; transitions happen by fading auxiliary parts in/out over long spans. Stereo: percussion spread moderately, room ambience short and dry to avoid epic halls. Every 40 seconds, migrate one accent voice to a neighboring timbre rather than adding fills. Absolutely ban crowd shouts, call-and-response shouts, dramatic ensemble hits, or tempo spikes. Emotional feel: communal steadiness translated into private focus—alert, grounded, not celebratory.",
  "style_tags": ["west-african-percussion", "groove-focus", "ensemble-percussion"],
  "energy_curve": "Flat kineticism—energy from continuity, not peaks.",
  "tempo_bpm_range": "74-84 BPM",
  "cultural_origin": "West African",
  "avoid": [
    "vocals",
    "chants",
    "solo showboating",
    "ensemble hits",
    "tempo surges"
  ]
}
```

## 7. Input: `"nordic folk"`

```json
{
  "title": "Fjord Glass Bow",
  "short_description": "Nordic folk timbres as a frost-soft instrumental drone—nyckelharpa whispers, no dance tune.",
  "lyria_prompt": "Instrumental Nordic folk colors strictly for concentration—no vocals, yoiks, or bardic storytelling. Use nyckelharpa or fiddle-like tones only as distant, heavily softened sustains rather than dance melodies; underpin with bowed bass or hurdy inspiration without buzz dominating; add frame drum or brushed pulse at ~72 BPM so light it reads as breath. Harmony stays modal and cold-warm toggling by half-step leanings over minutes, never by sudden turns. Include airy reed organ or harmonium pad at low level for spatial depth; wide stereo on highs, narrow lows. Maintain constant sonic presence—no gap between ‘verses’ because there are no verses, only slow textural tide. Prohibit foot-stomping accents, reel-speed bowing, obvious folk hooks, or triumphant lift common in festival arrangements. Emotional landscape: still winter daylight, vigilant calm—not saga climax. The listener should feel culturally placed in Nordic idioms yet psychologically freed to read or derive without narrative pull.",
  "style_tags": ["nordic-folk", "ambient-fiddle", "modal-drone"],
  "energy_curve": "Slow glacial shift; energy frozen-steady.",
  "tempo_bpm_range": "68-80 BPM",
  "cultural_origin": "Nordic",
  "avoid": [
    "vocals",
    "yoiks",
    "dance reels",
    "stomped accents",
    "hooky folk themes"
  ]
}
```
