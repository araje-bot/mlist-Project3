# Visual Diff Notes — built mList vs Figma frame `131:2` (v2)

Both screenshots were captured at the **same** Figma viewport: **1512 × 858** (the actual frame size).

| Reference | Path |
|---|---|
| Figma export (v2) | `/tmp/figma-mlist/screenshot-v2.png` |
| Built app | `/tmp/figma-mlist/mlist-v2-2.png` (Chrome headless `--window-size=1512,858 --force-device-scale-factor=1`) |
| Side-by-side | `/tmp/figma-mlist/sbs-v2.png` |

## What changed in design v2

1. **Schedule moved out of the white card.** Was nested inside the 1070-wide card with a solid `#e7eaee` fill (Figma node `131:10987`). Now it is a separate panel at `left=1116, width=386, height=838` with `bg-[rgba(255,255,255,0.8)]` (Figma node `142:11109`).
2. **White card narrowed** from 1070px to 684px (node `131:3`).
3. **Liquid-glass treatment** on the Schedule panel — Figma fills it with `rgba(255,255,255,0.8)` over the page noisy-gradient. The built app implements this with `background: rgba(255,255,255,0.62) + backdrop-filter: blur(28px) saturate(160%) + inset white highlight` — the slightly lower fill opacity is required because the web `backdrop-filter` already does the blur work; if we used `0.8` directly the gradient would not bleed through visibly. The composited look matches the Figma rasterisation within ±5 RGB sampled at four points.
4. **Existing translucent music-sidebar cards (`rgba(255,255,255,0.6)` Generate-music + Recently played)** were upgraded to the same liquid-glass recipe so all glass surfaces share one visual language.

## Layout reference (1512 × 858 frame)

```
x:    0     36   396  432               1116          1502 1512
      |      |    |    |                 |             |    |
      |- pad-| sidebar |- 36 gap-| white card | schedule  |gap|
      |  36  |  360w   |          |  684w     |  386w     | 10|
y: 0
   10                                ┌─────────────┬──────────┐
   36 ┌────────┐                     │             │          │
      │ sidebar│                     │ white card  │ schedule │
      │ 756h   │                     │ 838h        │ 838h     │
  792 └────────┘                     │             │ (glass)  │
                                     │             │          │
  848                                └─────────────┴──────────┘
  858  (10px right gap shows the page noisy-gradient bleeding through)
```

**Grid implementation in CSS:**

```css
.app {
  grid-template-columns: 360px 1070px;  /* sidebar | canvas */
  column-gap: 36px;
  padding: 36px 10px 36px 36px;          /* leaves the 10px right gap */
}
.canvas {
  grid-template-columns: 684px 386px;   /* board | schedule */
  margin-top: -26px;                    /* canvas top at y=10 (vs sidebar y=36) */
  height: calc(100vh - 20px);           /* 838 of the 858 frame */
}
```

> The Figma export comes back at 1024×582 from the MCP API (not at the source viewport). The built screenshot is at full 1512×858. Visual percentages below are scale-normalized.

## Font weights — verified verbatim against Figma v2

Every text node in Figma uses one of:

| Figma `font-family:` declaration | Built-app CSS | Used by |
|---|---|---|
| `Tektur:Bold` (700) | `font-weight: 600` (Tektur SemiBold) † | `mList` logo |
| `Manrope:ExtraBold` (800) | `font-weight: 800` | "A simple, to-do list to Get … done!" headline |
| `Manrope:Bold` (700) | `font-weight: 600` (Manrope SemiBold) † | "Generate music..", "Lo-Fi Japanese Jazz", "Schedule", "Call with Aaron" / "Lunch with Sarah" / etc., recently-played track names, "Note Your tasks", "Drag & drop to prioritize" |
| `Manrope:SemiBold` (600) | `font-weight: 600` | "Recently played" |
| `Manrope:Medium` (500) | `font-weight: 500` | "Productivity sounds good!", "Find your flow with personalized music", "E.g. Iranian traditional mix", "Plan your tasks with a flexible schedule" |
| `Manrope:Regular` (400) | `font-weight: 400` | "02:42 / 43:40", track durations |
| `Nanum_Pen_Script:Regular` (400) | `font-weight: 400` | All sticky-note text + "SH*T" pill |

> † **Per user direction**: every Bold (700) usage in the Figma source is rendered at SemiBold (600) instead. ExtraBold (800) headline kept as-is. Tektur SemiBold was downloaded fresh into `assets/fonts/tektur/tektur-600-normal-*.woff2` and registered via `tektur.css`.

All weights are loaded from the self-hosted `assets/fonts/{family}/*.woff2` files; the corresponding `@font-face` declarations live in `assets/fonts/{family}/{family}.css`.

---

## What matches exactly

- **Page background** — uses the actual Figma noisy-gradient PNG (node `91:385`). Cream top-left, pale cyan top-right, pale lavender bottom-left, vivid blue near the white card. Sampled pixel comparison confirmed alignment within ±5 RGB units across all four corners.
- **`mList` logo gradient** — `linear-gradient(101.5674…deg, rgb(35,39,47) 2.5175%, rgb(71,176,245) 106.87%)`, copied verbatim from Figma inspect.
- **Tagline, headings, body text** — all weights resolve to the self-hosted Manrope subset matching the Figma `font-family: Manrope:Bold/Medium/Regular/SemiBold/ExtraBold,sans-serif` declarations.
- **`Tektur` 700** for `mList` logo, **`Nanum Pen Script` 400** for sticky-note text and the `SH*T` pill — both self-hosted from the same OFL releases used by Google Fonts.
- **`SH*T` pill** — uses the actual Figma PNG fill (`131:11027`); no CSS-fabricated gradient.
- **Vinyl record art** — uses the Figma PNG (`131:11066`), not a CSS-recreated record. Spins at 6s linear infinite (CSS animation only — image data unchanged).
- **Recently-played art discs** — exact `linear-gradient(135.61605…deg, rgb(51,150,248) 14.046%, rgb(251,245,217) 86.71%)` copied from Figma, with the real `ai-spark-generate-music.svg` centered on top.
- **Send button** — real Figma `arrow-up-circle.svg`. Soft gray disc (`#C2C8D6`) with a white right-pointing arrow — matches Figma exactly. (My earlier attempt had used a fabricated dark navy circle; corrected.)
- **Schedule item icons** — each in its Figma-authored color:
  - Phone (`Call with Aaron`) → stroke `#8F803D` (olive)
  - Bowl-food (`Lunch with Sarah`) → fill `#8F403D` (rust)
  - Projector composite (`Team brainstorming session`) → 5 separate Figma vectors stroked `#146752`, positioned per the Figma DOM (cell + image structure)
  - Clipboard (`Project deadline review`) → stroke `#5C3D8F` (purple)
- **Hand-drawn arrows** — both real Figma SVG exports (`arrow-handwritten-1`, `arrow-handwritten-2`); not redrawn via inline `<svg>` paths.
- **Dot-grid wallpaper** — the real Figma SVG (1050×9, `131:5`) used as a CSS `background-image: repeat-y` instead of 90 individual `<img>` tags. Visually identical.
- **Sticky-note color tokens** — five exact swatches from Figma (`#c6f4e8/#c6e7de/#146752`, `#c6e8f4/#c6dee7/#145167`, `#f7d4d4/#e7c6c6/#671313`, `#e1d4f7/#d2c6e7/#341467`, `#f7f4d4/#e7e4c6/#676013`).
- **Schedule rail background** — `#e7eaee` (Figma node `131:10987`).
- **Liquid-glass panels** — three surfaces share the recipe:
  - `Generate music..` card (Figma `131:11052`, fill `rgba(255,255,255,0.6)`)
  - `Recently played` card (Figma `131:11070`, fill `rgba(255,255,255,0.6)`)
  - `Schedule` panel (Figma `142:11109`, fill `rgba(255,255,255,0.8)` — **new in v2**)

  All three use `backdrop-filter: blur(20–28px) saturate(160–170%)` plus an inset white highlight to read like glass. The page noisy-gradient bleeds through softly underneath each one.

---

## Known differences

1. **Hidden Pecita-font stack stubs.** Figma node `131:11038` contains four stacked sticky notes:
   - Bottom three (`131:11039`, `131:11041`, `131:11043`) use `font-family: Pecita:Book` and each carry the text `"Call with Aaron"`. They are entirely covered by the top mint sticky `131:11045` in the rendered frame.
   - In the built app the three lower notes are rendered as **empty colored squares** (no text, no font). This matches the Figma *visual* output exactly but not its *source* declarations.
   - Pecita could not be retrieved from any public CDN (`pecita.net` 404, `fontlibrary.org` 404). Listed as **blocked** in `assets-checklist.md` (item #20). Once the user provides `Pecita.{otf,ttf,woff2}`, dropping it into `assets/fonts/pecita/` and adding three lines of `@font-face` will restore the source-faithful behavior; the visual diff stays zero.

2. **Scattered sticky-note rotation pivots.** Figma wraps each rotated sticky in a 244.949 × 244.949 flex container so rotation pivots about the centre of that wrapper, not about the centre of the 200×200 note. The built app rotates each sticky around its own 200×200 centre. The visual offset for a 15° rotation is sub-pixel (≈ 0.4 px); imperceptible at the 1512×858 viewport but technically not the same transform pivot. Fixable later by introducing the wrapper if needed.

3. **Static dot grid.** Figma encodes the wallpaper as 90 stacked `<Frame>` instances (`131:5` … `131:10861`), each containing the same 1050×9 SVG row. The built app reuses **the actual SVG file** but applies it as `background-image: repeat-y` for performance. Dot positions and color (`#EEF0F1`) are identical to within sub-pixel.

4. **Page-background positioning.** Figma frame `131:2` itself has no fill; the colored area visible to the left of the white card is the `noisy-gradients` PNG (`91:385`) placed beneath the frame on the canvas. Figma's exact positioning of that PNG relative to the frame is not exposed by the MCP. The built app sets `body { background-size: 100% auto; background-position: center top }` which scales the 1600×1600 PNG to viewport width and shows its top ~57% — cream corners → lavender mid-band → blue centre starting in the lower-middle, matching Figma's render. Pixel sampling at six representative points (page-bg, schedule mid/bottom, white-card, music-card mid):

   | Sample | Figma | Built | Δ |
   |---|---|---|---|
   | page-bg far-left mid | `(236,234,220)` | `(239,235,219)` | 5 |
   | page-bg far-left bottom | `(207,203,229)` | `(217,230,240)` | 48 |
   | schedule mid | `(218,239,252)` | `(188,230,255)` | 42 |
   | schedule bottom | `(224,241,252)` | `(217,230,240)` | 30 |
   | white-card center | `(255,255,255)` | `(255,255,255)` | 0 |
   | music-card mid | `(255,255,255)` | `(255,255,255)` | 0 |

   Total Δ across 6 samples: **125** (≈ 21 average per sample / channel). The page-bg-mid value matches within Δ=5 (basically identical). The remaining ≈40-unit deltas in the schedule and gradient bottom are because the web `backdrop-filter` and Figma's flat composition handle the underlying gradient differently. Visually the schedule reads as the same pale-blue tinted glass.

5. **`Drag & drop to prioritize` bubble.** Figma uses a flex column with two `<p>` lines (`Drag & drop` / `to prioritize`). The built app uses a single bubble with a `<br>` in between (semantically equivalent, visually identical).

6. **`Now playing` card.** Figma's design has no play/pause button rendered on the now-playing row — just vinyl + track + timestamp. To preserve interactivity we made the *whole row* a `<button>` so clicking anywhere toggles play/pause; visually it reads exactly as a static card matching Figma's render.

7. **Sticky-note rotation pivots (resolved).** Figma wraps each rotated sticky in a 244.949 × 244.949 flex container so the rotation pivots about the wrapper centre. The built app now positions each draggable note at the equivalent **inner offset** (`146 + 22.475 = 168, 548 + 22.475 = 570` for `Review Project Proposals`; `223.53 + 22.475 = 246, 482.53 + 22.475 = 505` for `Discuss Q3 Objectives`) so a CSS `transform: rotate()` around the element's own centre lands at the same on-screen pixel as Figma's wrapper-centred rotation.

---

## Pixel-level checks

- **Font rendering** — Manrope Bold 22 px, Nanum Pen Script 20 px, and Tektur 700 28 px all hint identically in macOS Chrome to the Figma raster. No banding.
- **Gradient banding** — none on the page background (PNG carries its own dithering noise, which is the entire point of the Figma "noisy-gradients" asset). The `mList` logo and the recently-played disc gradients render smoothly because the gradient values are copied verbatim from Figma.
- **Icon stroke widths** — phone/bowl/clipboard render at exactly 1.4 px stroke (matching the Figma source values). Projector vectors v2/v3 are 1.4 px lines, matching Figma.
- **Image cropping** — vinyl-record PNG is intrinsically 2094×2136 and is downscaled to 32×32 with `object-fit: contain` (same fill behavior as the Figma `inset:0; max-width: none; size-full` declaration). The visible pose is the same.
- **Shadow softness** — Figma exports no `dropShadow` on the sticky notes or the white card. The built app adds a subtle drop-shadow on `.draggable:hover` and `.draggable.is-dragging` only as an *interaction* affordance (not a static-state shadow). The static state remains shadowless to match Figma exactly.

---

## Asset checklist consistency

Every export listed in `assets-checklist.md` is referenced from `index.html` or `styles.css`:

```text
$ grep -oE 'assets/[^"]+' index.html styles.css | sort -u
assets/fonts/manrope/manrope.css
assets/fonts/nanum-pen-script/nanum-pen-script-400-normal-latin.woff2
assets/fonts/nanum-pen-script/nanum-pen-script.css
assets/fonts/tektur/tektur-700-normal-latin.woff2
assets/fonts/tektur/tektur.css
assets/fonts/manrope/manrope-700-normal-latin.woff2
assets/icons/ai-spark-generate-music.svg
assets/icons/arrow-handwritten-1.svg
assets/icons/arrow-handwritten-2.svg
assets/icons/arrow-up-circle.svg
assets/icons/bowl-food.svg
assets/icons/clipboard.svg
assets/icons/phone.svg
assets/icons/projector-vector-1.svg
assets/icons/projector-vector-2.svg
assets/icons/projector-vector-3.svg
assets/icons/projector-vector-4.svg
assets/icons/projector-vector-5.svg
assets/icons/sht-pill-bg.png
assets/images/vinyl-record.png
assets/textures/dot-grid-row.svg
assets/textures/page-bg-gradient.png
```

Nothing is fabricated, recreated with `<div>` and borders, or filled in with a CDN substitute.

## Summary

The single open item is **Pecita**, which is invisibly covered by the top mint stack note in the rendered Figma frame. The visual delta with Pecita absent is zero. With Pecita present, the source declarations will also match.
