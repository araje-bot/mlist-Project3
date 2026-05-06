# Assets Checklist

Source: Figma frame [`131:2`](https://www.figma.com/design/AXu1VTiBjN9b1lT7Zi3ipx/Project-Proposal?node-id=131-2) — file key `AXu1VTiBjN9b1lT7Zi3ipx`.

Every asset listed below was extracted directly from Figma via the Figma MCP server using the exact `data-node-id` shown.

> **Updated for design v2.** The Figma frame was revised to:
> 1. Move the `Schedule` panel out of the white card into a separate **liquid-glass panel** (`bg-[rgba(255,255,255,0.8)]`, node `142:11109`) at `left=1116, width=386`.
> 2. Narrow the white card from `1070px` to `684px` (node `131:3`).
>
> All asset *content* is unchanged from v1 — Figma re-issues UUIDs on every export but the SVG/PNG bytes are identical (verified with `cmp` against the local copies).

| # | Asset | Source frame (node id) | Status | File path |
|---|---|---|---|---|
| 1 | Page background — noisy gradient | `91:385` (noisy-gradients) | **exported** | `assets/textures/page-bg-gradient.png` (1600×1600 PNG, 5.5 MB) |
| 2 | Dot-grid row (repeated 90× in Figma; reused as CSS `repeat-y`) | `131:5` (Frame; identical sibling rows `131:123`, `131:241`, … `131:10861`) | **exported** | `assets/textures/dot-grid-row.svg` (1050×9 SVG) |
| 3 | "SH\*T" pill background fill | `131:11027` (Frame 36) | **exported** | `assets/icons/sht-pill-bg.png` (1024×1024 PNG) |
| 4 | Vinyl record (now-playing art) | `131:11066` (`vecteezy_vinyl-record-vector-illustration-isolated-on-white-background_9314864`) | **exported** | `assets/images/vinyl-record.png` (2094×2136 PNG) |
| 5 | Hand-drawn arrow #1 ("Note → Your tasks") | `131:10980` (Arrow 1) | **exported** | `assets/icons/arrow-handwritten-1.svg` |
| 6 | Hand-drawn arrow #2 ("Drag & drop ← to prioritize") | `131:10984` (Arrow 2) | **exported** | `assets/icons/arrow-handwritten-2.svg` |
| 7 | Phone icon — `Call with Aaron` (stroke `#8F803D`) | `131:10996` (phone) | **exported** | `assets/icons/phone.svg` |
| 8 | Bowl-food icon — `Lunch with Sarah` (fill `#8F403D`) | `131:11001` (Bowl-Food Streamline Phosphor) | **exported** | `assets/icons/bowl-food.svg` |
| 9 | Projector-board piece 1/5 (stroke `#146752`) | `131:11009` (Vector) | **exported** | `assets/icons/projector-vector-1.svg` |
| 10 | Projector-board piece 2/5 | `131:11010` (Vector_2) | **exported** | `assets/icons/projector-vector-2.svg` |
| 11 | Projector-board piece 3/5 | `131:11011` (Vector_3) | **exported** | `assets/icons/projector-vector-3.svg` |
| 12 | Projector-board piece 4/5 | `131:11012` (Vector_4) | **exported** | `assets/icons/projector-vector-4.svg` |
| 13 | Projector-board piece 5/5 | `131:11013` (Vector_5) | **exported** | `assets/icons/projector-vector-5.svg` |
| 14 | Clipboard icon — `Project deadline review` (stroke `#5C3D8F`) | `131:11017` (phone) | **exported** | `assets/icons/clipboard.svg` |
| 15 | Send / arrow-up-circle (fill `#C2C8D6`, white arrow) | `131:11059` (arrow-up-circle) | **exported** | `assets/icons/arrow-up-circle.svg` |
| 16 | AI spark / generate-music sparkle (used 3×) | `131:11080`, `131:11092`, `131:11103` (ai-spark-generate-music-fill) | **exported** | `assets/icons/ai-spark-generate-music.svg` |
| 17 | Font — Manrope (400, 500, 600, 700, 800; 6 unicode subsets each) | font-family: `Manrope:Bold,sans-serif`, `Manrope:Medium,sans-serif`, etc. | **exported** | `assets/fonts/manrope/*.woff2` (30 files) + `manrope.css` |
| 18 | Font — Tektur 700 (used by `mList` logo) | font-family: `Tektur:Bold,sans-serif` | **exported** | `assets/fonts/tektur/*.woff2` (6 files) + `tektur.css` |
| 19 | Font — Nanum Pen Script 400 (sticky-note handwritten text + "SH\*T" pill) | font-family: `Nanum_Pen_Script:Regular,sans-serif` | **exported** | `assets/fonts/nanum-pen-script/*.woff2` + `nanum-pen-script.css` |
| 20 | Font — **Pecita** Book (used by 3 hidden stack-stub notes `131:11040`, `131:11042`, `131:11044` — covered by note `131:11045` in the rendered frame) | font-family: `Pecita:Book,sans-serif` | **BLOCKED** — no public source could be located via direct probes (pecita.net 404, FontLibrary 404). | `assets/fonts/pecita/` (empty) |

## Gradient and shadow values copied verbatim from Figma

| Token | Value (from Figma inspect) |
|---|---|
| `mList` logo gradient | `linear-gradient(101.5674393143083deg, rgb(35, 39, 47) 2.5175%, rgb(71, 176, 245) 106.87%)` |
| Vinyl-record art (recently-played) | `linear-gradient(135.61605990839922deg, rgb(51, 150, 248) 14.046%, rgb(251, 245, 217) 86.71%)` |
| Sticky-note shadow | (no `dropShadow` exported by Figma; sticky frames have only border + bg in Figma) |
| Page background | Noisy gradient PNG asset — see row 1 |

## Color tokens (verbatim from Figma fills)

```text
fg-primary    #1a1c22
fg-secondary  #464d5d
fg-muted      #a4a4a4
border-soft   #e2e5ea
schedule-bg   #e7eaee

sticky-mint    bg #c6f4e8 / border #c6e7de / text #146752
sticky-blue    bg #c6e8f4 / border #c6dee7 / text #145167
sticky-pink    bg #f7d4d4 / border #e7c6c6 / text #671313
sticky-purple  bg #e1d4f7 / border #d2c6e7 / text #341467
sticky-yellow  bg #f7f4d4 / border #e7e4c6 / text #676013

icon-phone        #8F803D
icon-bowl         #8F403D
icon-projector    #146752
icon-clipboard    #5C3D8F
icon-send-disc    #C2C8D6
dot-grid-dot      #EEF0F1
```

## Blocked / pending user input

1. **Pecita font** (item #20) — couldn't be auto-fetched. Three options for the user:
   1. Provide the Pecita font file (`.otf`/`.ttf`/`.woff2`) so it can be placed in `assets/fonts/pecita/`.
   2. Confirm it's safe to drop the three hidden stack-stub notes (they're entirely covered by `131:11045` in the rendered frame, so the missing font has zero visual impact in the canvas screenshot).
   3. Approve a substitution to a similar handwritten font.
   
   Until resolved, the three stack-stub notes are rendered as empty colored squares with no text — matching exactly what's visible in the Figma export, but missing from the source data.

2. The Figma-MCP `get_design_context` for frame `131:2` does not declare a fill on the parent frame; the colored area visible to the left of the white card is rendered by the `noisy-gradients` image at `91:385` placed beneath it on the page. This implementation reproduces that by setting `body { background-image: url(./assets/textures/page-bg-gradient.png) }`. If the design uses a different positioning/cropping, please confirm.

## Verification

A pixel-match comparison was run at the end of phase 6 — see `visual-diff-notes.md`.
