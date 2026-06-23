# SUVIDHA — Design Tokens (Vertical Kiosk)

All values are pinned to `designs/vertical-pages-v1.jsx`, `designs/kiosk-shell.jsx`, and the two HTML entry points (`Vertical Kiosk Designs v1.html`, `SUVIDHA Vertical Kiosk v2.html`). Source-of-truth values are in `oklch()` — hex equivalents are approximate.

## Viewport

| Token | Value | Use |
|---|---|---|
| Design width | `1080px` | All artboards locked to this width |
| Design height | `1920px` | All artboards locked to this height |
| Orientation | `portrait-primary` | Lock in PWA manifest |
| Density | `1x logical` (kiosk runs at native res) | |

## Colors

### Brand

| Token | oklch | Hex (≈) | Use |
|---|---|---|---|
| `--indigo-900` | `oklch(0.28 0.10 270)` | `#1f1d61` | Headings on light, dark surfaces |
| `--indigo-700` | `oklch(0.38 0.13 270)` | `#3a3596` | **Primary** — CTAs, brand mark fill, links |
| `--indigo-500` | `oklch(0.55 0.14 270)` | `#5e57c6` | Hovers, secondary accents |
| `--indigo-300` | `oklch(0.78 0.06 270)` | `#b8b3d8` | Borders, ghost-button outlines |
| `--indigo-100` | `oklch(0.93 0.025 270)` | `#e6e3f1` | Info pills, sub-surfaces |
| `--saffron-700` | `oklch(0.62 0.15 65)` | `#b97315` | Welcome label, accent text |
| `--saffron-500` | `oklch(0.74 0.15 65)` | `#e9a23b` | **Accent** — secondary CTA, brand mark accent |
| `--saffron-300` | `oklch(0.86 0.09 65)` | `#f0c98c` | Subtle highlights |
| `--saffron-100` | `oklch(0.95 0.04 65)` | `#fbeed7` | Soft backgrounds |

### Department sub-themes (same chroma/lightness, hue-shifted)

| Token | Hex (≈) | Department |
|---|---|---|
| `--dept-elec` | `#e0aa3e` | Electricity (yellow-amber) |
| `--dept-gas` | `#d97742` | Gas (warm orange) |
| `--dept-water` | `#52a3c2` | Water / Municipal (cyan) |
| `--dept-waste` | `#5fa974` | Sanitation (green) |
| `--dept-health` | `#cb6789` | Healthcare (pink) |
| `--dept-trans` | `#5b87c4` | Transport (blue) |

When using as a card tint, mix 22% with white:
```css
background: color-mix(in oklab, var(--dept-elec) 22%, white);
```

### Status

| Token | Hex (≈) | Use |
|---|---|---|
| `--ok` | `#3f9e5d` | Success, verified, completed |
| `--warn` | `#e9a23b` | Pending, in-progress, near-SLA |
| `--err` | `#c63b2c` | Errors, overdue, emergency |

### Ink (text)

| Token | Hex (≈) | Use |
|---|---|---|
| `--ink-900` | `#34303b` | Body, headings |
| `--ink-700` | `#5a5564` | Secondary text |
| `--ink-500` | `#8a8590` | Tertiary, captions |
| `--ink-300` | `#c5c2c8` | Disabled |

### Surfaces

| Token | Hex (≈) | Use |
|---|---|---|
| `--surface-0` | `#fdfbf7` | Page background |
| `--surface-1` | `#f7f3ec` | Subtle elevated surface |
| `--surface-2` | `#ece6dc` | Quiet button background |
| `--cream` | `#f7f2e8` | Kiosk wash base (landing) |
| `--line` | `#e6e0d3` | Borders, dividers |

### Kiosk wash (landing/home background)

```css
background:
  radial-gradient(800px 800px at 100% 0%, color-mix(in oklab, var(--saffron-300) 28%, transparent), transparent 55%),
  radial-gradient(900px 900px at 0% 100%, color-mix(in oklab, var(--indigo-100) 60%, transparent), transparent 55%),
  var(--cream);
```

## Typography

### Font stacks

- **`--font-ui`** — `"Plus Jakarta Sans", "Noto Sans", system-ui, sans-serif`
- **`--font-multi`** — `"Noto Sans", "Noto Sans Devanagari", "Noto Sans Bengali", "Noto Sans Tamil", system-ui, sans-serif` (mixed-script lines)
- **`--font-mono`** — `"JetBrains Mono", ui-monospace, monospace` (reference numbers, GPS, dates)

### Indian script families to load on demand

Load via Google Fonts CDN with `font-display: swap`:

`Noto Sans Devanagari` (Hindi, Marathi, Sanskrit) · `Noto Sans Bengali` (Bengali, **Assamese**) · `Noto Sans Tamil` · `Noto Sans Telugu` · `Noto Sans Gujarati` · `Noto Sans Gurmukhi` (Punjabi) · `Noto Sans Kannada` · `Noto Sans Malayalam` · `Noto Sans Oriya` · `Noto Sans Tibetan` · `Noto Sans Meetei Mayek` (Manipuri)

> **Note on Assamese:** Assamese uses the Bengali-Assamese script and renders correctly with `Noto Sans Bengali`. The two scripts share most glyphs but differ in `ৰ` (Assamese ra) and `ৱ` (Assamese va). Set `lang="as"` on the root element so OpenType locale features select correct variants.

### Vertical-kiosk scale (1080×1920)

| Use | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|
| Hero (landing) | `96` | 800 | 1.02 | -0.025em |
| H1 / page title | `80` | 800 | 1.02 | -0.025em |
| H2 / section title | `56` | 800 | 1.05 | -0.022em |
| H3 / card title | `36` | 700 | 1.15 | -0.015em |
| Body large | `24` | 400 | 1.5 | normal |
| Body | `20` | 400 | 1.5 | normal |
| Body strong | `20` | 600 | 1.5 | normal |
| Caption / meta | `16` | 400 | 1.4 | normal |
| Label tag (uppercase, mono) | `13` | 500 | 1 | 0.14em |
| Reference number (mono) | `30–38` | 700 | 1 | normal |
| Keypad digit (mono) | `44` | 700 | 1 | normal |

**Minimum readable size on this kiosk: 16px.** Anything smaller will be illegible at standing distance.

**Elderly mode** — bump all sizes by 1.2×; min becomes 20px.

**Blind mode** — typography becomes secondary; voice + screen reader are primary. Keep on-screen text legible for assistants.

## Spacing

4px base scale: `4, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 44, 60`. Common patterns on the vertical kiosk:

- Page horizontal padding: `60px`
- Card padding: `28–36px`
- Section gap: `28–36px`
- Tile minimum height: `200px` (extras grid), `260px` (service tiles), `180px` (department row)
- Top bar padding: `36px 60px 28px`
- Bottom action bar padding: `24px 60px 36px`

## Radius

| Token | Value | Use |
|---|---|---|
| `--r-md` | `18px` | Buttons, inputs, small cards |
| `--r-lg` | `28px` | Default cards |
| `--r-xl` | `40px` | Hero cards, dept tiles |
| `999px` | full | Chips, pills, badges |

## Shadows

| Token | Value | Use |
|---|---|---|
| `--shadow-1` | `0 2px 6px rgba(30,20,50,.06)` | Resting cards |
| `--shadow-2` | `0 8px 24px rgba(30,20,50,.08), 0 3px 6px rgba(30,20,50,.05)` | Interactive / selected cards |
| `--shadow-3` | `0 20px 60px rgba(30,20,50,.14)` | Elevated overlays, modal-like |

## Touch targets (vertical kiosk specific)

- **Chip / minor button**: min-height 56px
- **Default button**: min-height 80px
- **Primary CTA**: min-height 80px (regular) / 110px (XL)
- **Keypad key**: 110px × 110px (single hand thumb-reach)
- **OTP cell**: 88px × 110px
- **Department row (Home)**: 180px tall (whole row is tappable)
- **Service tile**: 240–260px tall

**Spacing between adjacent targets**: min 12px (16px preferred)

## Iconography

- **Stroke**: 2px (consider 2.2px on tiny chips below 32px)
- **Style**: rounded line caps & joins
- **Grid**: 24×24 viewBox, scale up via parent
- **Sizes used**: 14, 22, 28, 36, 44, 48, 56, 72 px
- **Production swap**: replace inline `ic` map in `vertical-pages.jsx` with `lucide-react`. Direct lucide equivalents for all used icons:

| Design icon | lucide-react |
|---|---|
| `bolt` | `Zap` |
| `flame` | `Flame` |
| `drop` | `Droplet` |
| `trash` | `Trash2` |
| `globe` | `Globe` |
| `help` | `HelpCircle` |
| `user` | `User` |
| `shield` | `Shield` / `ShieldCheck` |
| `arrow` | `ArrowRight` |
| `back` | `ArrowLeft` |
| `check` | `Check` |
| `sos` | `AlertCircle` |
| `bell` | `Bell` |
| `receipt` | `Receipt` |
| `track` | `Clock` |
| `pin` | `MapPin` |
| `qr` | `QrCode` |
| `finger` | `Fingerprint` |
| `voice` | `Mic` |
| `plus` | `Plus` |
| `print` | `Printer` |
| `phone` | `Phone` |
| `type` | `Type` |
| `family` | `Users` |
| `heart` | `Heart` |
| `bus` | `Bus` |
| `building` | `Building2` |
| `search` | `Search` |
| `cog` | `Settings` |

## Animations

| Use | Duration | Easing |
|---|---|---|
| Button press (`:active`) | 80ms | ease-out |
| Card hover/select | 150ms | ease |
| Screen transition | 250ms | cubic-bezier(0.2, 0.7, 0.3, 1) |
| Voice mode pulse | 2s | ease-in-out, infinite |
| Wake-word flash | 600ms | ease-out, fires once |
| Loading spinner | 1s | linear, infinite |

## Layout grid (1080×1920)

- 12-column grid is overkill at this width. Use **flex / stack** layouts almost always.
- For grids: 1 col (full-bleed), 2 col (forms, half-tiles), 3 col (compact extras) — never 4+
- Edge gutter: 60px
- Inter-column gutter: 16–24px

---

## v2 additions — Status row (Weather + AQI + Clock + Connectivity)

Lives between the brand bar and content on every screen. Implemented as `.vk-status` in CSS, `<StatusRow>` in React (`kiosk-shell.jsx`).

### Container

| Property | Value |
|---|---|
| Padding | `0 56px 18px` |
| Layout | `display:flex; gap:12px; align-items:stretch` |
| Children | 4 tiles, flex-grown as `1.2 / 1 / 0.9 / auto` |

### Tile (`.stat`)

| Property | Value |
|---|---|
| Background | `white` |
| Border | `1.5px solid var(--line)` |
| Radius | `18px` |
| Padding | `14px 18px` |
| Min height | `64px` |
| Inner gap | `12px` |
| Inner icon block | `40×40px` rounded `12px` |
| Label (`.lbl`) | mono, `10px`, `letter-spacing 0.16em`, uppercase, `var(--ink-500)` |
| Value (`.val`) | `var(--font-ui)`, `22px`, `font-weight 700`, `letter-spacing -0.01em`, `var(--indigo-900)` |

### Weather tile

- Icon block tinted with saffron: `background: color-mix(in oklab, var(--saffron-500) 22%, white); color: var(--saffron-700)`
- Label format: `<City> · <condition>` (e.g. `Guwahati · Partly cloudy`)
- Value format: `<temp>°C` + small sub `feels <temp+2>°` in `--ink-500`
- Icon glyph map (in `kiosk-shell.jsx` `ic` map):
  - `sun` → clear
  - `cloud` → overcast
  - `cloudsun` → partly cloudy
  - (rain / storm icons can be added when needed; reuse `lucide-react` `CloudRain`, `CloudLightning`)

### AQI tile

Bound to CPCB AQI ranges (used by India's national AQI). Color follows the band — never invent new hues; use the existing tokens.

| Range | Band | Modifier class | Icon tint background | Icon tint color | Value text color |
|---|---|---|---|---|---|
| `0 – 50` | Good | `.stat-aqi-good` | `color-mix(in oklab, var(--ok) 22%, white)` | `var(--ok)` | `var(--ok)` |
| `51 – 100` | Satisfactory | `.stat-aqi-good` | same | same | `var(--ok)` |
| `101 – 200` | Moderate | `.stat-aqi-mod` | `color-mix(in oklab, var(--warn) 28%, white)` | `oklch(0.45 0.12 75)` | `oklch(0.74 0.15 75)` |
| `201 – 300` | Poor | `.stat-aqi-poor` | `color-mix(in oklab, var(--err) 18%, white)` | `var(--err)` | `var(--err)` |
| `301 – 400` | Very Poor | `.stat-aqi-poor` | same | same | `var(--err)` |
| `401 – 500` | Severe | `.stat-aqi-poor` | same | same | `var(--err)` |

Icon glyph: leaf (`ic.leaf`) — same across all bands.

### Clock tile

- Icon block tinted `var(--surface-2)` / `var(--ink-700)`
- Label: short date `Wed, 29 Apr`
- Value: mono `14:32` (24-hour, IST)

### Connectivity tile

- Compact (`padding 14px 14px`, just the icon)
- Online → `.stat-net` (green tint, `ic.wifi`)
- Offline → swap to `.b-err` styling + show "OFFLINE" mini-label

### Spacing & insertion

- Sits at y ≈ 200–290px in the 1920-tall canvas
- Drops `vk-top` bottom padding to `18px` (was `28px`) when status row is present
- Drops `vk-body` top padding to `16px` (was `24px`) to compensate

### When to hide

The shell prop is `showStatus={true}` by default. Pass `showStatus={false}` on:
- Full-screen Voice overlay (dark indigo background; status would clash)
- SOS / Emergency detail (focus the user on the emergency, not the weather)
- Print receipt preview (irrelevant)

### Refresh cadence (data layer)

| Source | Cadence | Fallback when offline |
|---|---|---|
| Weather | 15 min | Last cached value with `as of HH:MM` sub-line |
| AQI | 30 min | Last cached value with `as of HH:MM` sub-line |
| Clock | 1 s tick (but only repaints on minute change to save GPU) | Device clock |
| Connectivity | Continuous (`online`/`offline` events) | Show `OFFLINE` badge |

### Accessibility

- The status row is informational — `role="status"` on the outer container, `aria-live="polite"`
- AQI value gets an `aria-label` like `Air quality 132, Moderate. Sensitive groups should reduce outdoor exertion.`
- Each tile is **not** a tap target — keep them visual-only. If you want users to drill into health advisories, do it via the on-page advisory card pattern shown in `VDashboard` and `VHealth`, not by making the tile clickable.

