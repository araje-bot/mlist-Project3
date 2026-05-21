# mList — Productivity sounds good!

A music-powered to-do app built for **INST630**. Generate music for flow-state,
Note tasks on sticky notes, and plan a flexible schedule.

Implemented from the [Figma design](https://www.figma.com/design/AXu1VTiBjN9b1lT7Zi3ipx/Project-Proposal?node-id=131-2&m=dev) using **plain HTML + CSS + JavaScript**, with **every visual asset pulled directly from the Figma file** — no fabricated icons, no CDN font fallbacks, no CSS-recreated illustrations.

## Project structure

```
Project-mList/
├── index.html                 # markup
├── styles.css                 # design tokens + layout
├── main.js                    # interactivity (no build step)
├── favicon.svg
├── assets/
│   ├── icons/                 # 13 SVGs + sht-pill-bg.png (real Figma exports)
│   ├── images/                # vinyl-record.png
│   ├── textures/              # page-bg-gradient.png + dot-grid-row.svg
│   └── fonts/                 # self-hosted woff2 (Manrope, Tektur, Nanum Pen Script)
├── assets-checklist.md        # every asset, its source frame, and status
└── visual-diff-notes.md       # 1512x858 pixel-match notes vs the Figma export
```

## Asset fidelity

This build follows a strict no-substitution rule:

- **Every icon, illustration, and image** is the exact Figma export (URLs from `get_design_context`/MCP server). No `<svg>` reconstructions, no `<div>+border` shapes, no library substitutes.
- **Page background** is the noisy-gradient PNG from Figma node `91:385`, served as a `body` background-image.
- **Fonts are self-hosted** under `assets/fonts/<family>/` with `@font-face` declarations per unicode subset. No `https://fonts.googleapis.com` link in `index.html`.
- **Gradients and color values** are copied verbatim from Figma's inspect panel into CSS (see `styles.css :root` for tokens).

The single open item is the **Pecita** font (used by three hidden stack-stub notes that are entirely covered by the top mint sticky in the rendered frame). It could not be auto-fetched and is listed as **blocked** in `assets-checklist.md`. Visual delta with Pecita absent is zero.

## Tech stack

| Layer | Choice |
|---|---|
| Markup | HTML5 |
| Styling | Vanilla CSS (custom-properties for design tokens) |
| Scripting | ES modules, no bundler |
| Drag/drop | [Pointer Events API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) |
| Persistence | `localStorage` |
| Audio FX | [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) |
| Typography | Self-hosted Manrope, Tektur, Nanum Pen Script (OFL) |

## Running locally

ES-module `<link>`/`<script>` references and the `body { background-image }` need to be served over HTTP, so just open the folder with any tiny static server.

### Option A — Python (no install)

```bash
cd Project-mList
python3 -m http.server 5173
```

### Option B — Node

```bash
cd Project-mList
npx serve .
```

### Option C — VS Code Live Server

Right-click `index.html` → **Open with Live Server**.

> Don't open the file directly with `file://` — many browsers block module-loaded fonts and same-origin asset requests for local files.

## Features

### Sticky notes (centre canvas)

- **Click brings to top** — clicking any sticky note bumps its z-index above every other note, so the freshly-touched note overlaps the others
- **Free drag** — drag a sticky anywhere on the canvas with mouse / touch / stylus (Pointer Events); positions persist to `localStorage`
- **Drop on Schedule → transforms into a task** — drag a sticky into the right-side Schedule panel and it morphs into a rectangular schedule item (white card + icon) at whichever vertical position you released it
- **Visual feedback** — while a sticky hovers over the schedule the panel glows with a soft blue inner border so you know it's a valid drop target; the sticky shrinks and fades on drop while the new schedule row pops in
- **Keyboard nudging** — Tab to focus a sticky, then arrow-key to move 5 px (Shift = 20 px), bringing it to top automatically

### Schedule (right rail, liquid-glass panel)

- **Drag to reorder** — grab any schedule row and drag up or down to change priority (HTML5 drag-and-drop). Order persists to `localStorage`
- **Click to mark done** — strikes the row through and dims it
- **Pre-loaded with four** built-in tasks; new ones added by dragging stickies use a cycling default icon (phone → bowl → clipboard)

### Music sidebar

- **Generate-music input** — submitting the prompt prepends a new entry to *Recently played*; clicking any entry swaps it into *Now playing*
- **Now playing card** — clicking anywhere on the card toggles play / pause; the vinyl PNG spins while playing, freezes when paused; live-ticking timestamp; small Web-Audio click confirms the action

## Browser support

Targets evergreen Chrome/Safari/Edge/Firefox. Requires:

- ES Modules (Chrome 89+, Safari 14+, Firefox 60+)
- Pointer Events for drag/drop
- woff2 (universal in 2026)

## Design tokens

All colors and gradients live as CSS custom properties at the top of `styles.css` (search `:root`). Token values are sourced from Figma's inspect panel — see `assets-checklist.md` for the full table.

## Roadmap

- Real audio playback hooked into a public audio API (e.g. Spotify Web Playback)
- Persist task text/color/position from a backend, support add/delete
- Sync schedule with a real calendar (Google Calendar, ICS upload)
- Mobile-first variant of the layout
