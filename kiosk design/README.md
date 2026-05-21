# Handoff: SUVIDHA — 55″ Vertical Kiosk (v2 · complete)

## Overview

SUVIDHA is a multilingual government-services kiosk for Indian citizens. The build target is a **55-inch vertical (portrait) touchscreen** running at **1080 × 1920**, mounted at standing height inside civic offices (Electricity, Gas, Water/Municipal, Sanitation, Health, Transport).

This bundle is the **complete vertical design** combining:

- **v1** — the original 12 screens (Authentication, core service flows, utility screens)
- **v2** — 14 newly added screens that close every remaining feature gap in `MahizhnanC/kiosk-hackathon-2026` (Dashboard, Profile, Family, Gas billing, Municipal/Property tax/Water, Healthcare, Transport, Sanitation, Mobile-upload companion, Voice overlay, SOS detail)
- **Weather + AQI** — a new persistent status row added below the brand bar on every screen (city, temperature in °C, "feels like", live CPCB AQI value + band, date/time, connectivity)

26 screens in total, all locked to 1080 × 1920, sharing one design system.

Target repo: <https://github.com/MahizhnanC/kiosk-hackathon-2026/tree/map-voiceassistant-sms-fast2sms/kiosk-hackathon-2026-feature-upload-secure-flow>
(React 18 + Vite + Tailwind + i18next + sarvam / NVIDIA voice).

## About the Design Files

The files in `designs/` are **design references built with HTML + React (Babel-in-the-browser)**. They are prototypes showing intended look, layout, and behavior — **not production code to copy directly**.

Your task is to **port the existing codebase to match these designs** while keeping the functional architecture already in the repo (routing, i18n, voice assistant provider, accessibility provider, Aadhaar lookup, SMS via fast2sms, file upload secure flow, etc.). Replace existing Tailwind classes with the new tokens, lock the viewport to portrait 1080×1920, and re-organize each page to fit the vertical reach zone.

Two HTML entry points to open in a browser when designing:

| File | What it shows |
|---|---|
| `designs/Vertical Kiosk Designs v1.html` | The **original 12 screens** (Landing, Aadhaar, Auth, Mode, Home, Electricity menu, Form, Complaint, Tracker, Receipt, Schemes, Locator) |
| `designs/SUVIDHA Vertical Kiosk v2.html` | The **14 new screens** with the **Weather + AQI status row** baked into the shell |

The v2 shell (`kiosk-shell.jsx` → `VK` + `StatusRow`) is the canonical chrome going forward. Apply the new status row to v1 screens too when porting.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, radii, shadows, motion, and interactions are pinned down. See `tokens.md` for the full token table.

Open either HTML file in a browser and pan / zoom the canvas to inspect any screen. Click an artboard label to open it fullscreen at 1080×1920.

## Target Hardware

| Property | Value |
|---|---|
| Screen size | 55" |
| Orientation | Portrait (vertical) |
| Resolution | 1080 × 1920 (FHD portrait) |
| Touch | Capacitive multi-touch, 10-point |
| Top-of-screen height | ~1.6 m from floor |
| Operating mode | Kiosk lockdown · always-on · single-app PWA |
| Connectivity | Wired Ethernet + 4G fallback |
| Peripherals | Thermal printer, fingerprint scanner, iris cam, NFC, on-screen IME |

## Reach Zone Discipline

The user stands in front of the kiosk — every layout follows this band map:

| Y range | Zone | Use |
|---|---|---|
| `0 — 200px` | Top strip | Tricolor strip + brand bar (peripheral, glanceable) |
| `200 — 350px` | **Status row** (new in v2) | Weather · AQI · clock · connectivity |
| `350 — 700px` | Upper viewport | Page title, hero |
| `700 — 1500px` | **Primary content zone** | Forms, tiles, cards, keypads — must read AND touch |
| `1500 — 1820px` | Action zone | Primary CTAs (Submit, Continue) — easy reach without crouching |
| `1820 — 1920px` | Bottom bar | A+ text · Voice mode · **EMERGENCY** (always-visible) |

Rules:
- Never put a primary action in the top 700px
- Never put critical readable content in the bottom 200px
- Numeric keypads / OTP must sit in the 900–1500 band
- Emergency button is always bottom-right, always visible

## Screens / Views

### Flow 1 — Authentication (v1)

| Screen | Source repo file | Design component | Design file |
|---|---|---|---|
| Landing | `src/pages/Landing.jsx` | `VLanding` | `vertical-pages-v1.jsx` |
| Aadhaar entry | `src/pages/Login.jsx` | `VAadhaar` | `vertical-pages-v1.jsx` |
| Authenticate | `src/pages/Login.jsx` (OTP) | `VAuth` | `vertical-pages-v1.jsx` |
| Mode selection | `src/pages/ModeSelection.jsx` | `VMode` | `vertical-pages-v1.jsx` |

### Flow 2 — Service hubs

| Screen | Source repo file | Design component | Design file |
|---|---|---|---|
| Home | `src/pages/Home.jsx` | `VHome` | `vertical-pages-v1.jsx` |
| **Dashboard** (new) | `src/pages/Dashboard.jsx` | `VDashboard` | `kiosk-pages-personal.jsx` |
| Electricity menu | `src/pages/ElectricityMenu.jsx` | `VElecMenu` | `vertical-pages-v1.jsx` |
| **Gas menu** (new) | `src/pages/GasMenu.jsx` | `VGasMenu` | `kiosk-pages-services.jsx` |
| **Municipal menu** (new) | `src/pages/MunicipalMenu.jsx` | `VMunicipal` | `kiosk-pages-services.jsx` |

### Flow 3 — Department services

| Screen | Source repo file | Design component | Design file |
|---|---|---|---|
| Service form | `src/pages/Electricity.jsx` (and equivalents) | `VForm` | `vertical-pages-v1.jsx` |
| **Gas bill / payment** (new) | `src/pages/GasBills.jsx` | `VGasBill` | `kiosk-pages-services.jsx` |
| **Property tax** (new) | `src/pages/PropertyTaxPayment.jsx` | `VPropertyTax` | `kiosk-pages-services.jsx` |
| **Water connection + bill** (new) | `src/pages/Water.jsx` | `VWater` | `kiosk-pages-services.jsx` |
| **Healthcare** (new) | `src/pages/Healthcare.jsx` | `VHealth` | `kiosk-pages-services.jsx` |
| **Transport** (new) | `src/pages/Transport.jsx` | `VTransport` | `kiosk-pages-services.jsx` |
| **Sanitation** (new) | `src/pages/Sanitation.jsx` | `VSanitation` | `kiosk-pages-services.jsx` |

### Flow 4 — Complaints + utility

| Screen | Source repo file | Design component | Design file |
|---|---|---|---|
| Complaint (generic) | `src/pages/Complaints.jsx`, `ElectricityComplaint.jsx`, `GasComplaint.jsx`, `MunicipalGrievance.jsx` | `VComplaint` | `vertical-pages-v1.jsx` |
| Tracker | `src/pages/TrackStatus.jsx` | `VTracker` | `vertical-pages-v1.jsx` |
| Receipt | `src/pages/Receipt.jsx` | `VReceipt` | `vertical-pages-v1.jsx` |
| Schemes | `src/pages/SchemeDiscovery.jsx` | `VSchemes` | `vertical-pages-v1.jsx` |
| Office locator | `src/pages/OfficeLocator.jsx` | `VLocator` | `vertical-pages-v1.jsx` |

### Flow 5 — Personal + cross-cutting (new in v2)

| Screen | Source repo file | Design component | Design file |
|---|---|---|---|
| **Consumer profile** | `src/pages/ConsumerProfile.jsx` | `VProfile` | `kiosk-pages-personal.jsx` |
| **Family profile** | `src/pages/FamilyProfile.jsx` | `VFamily` | `kiosk-pages-personal.jsx` |
| **Mobile upload (QR companion)** | `src/pages/MobileUpload.jsx`, `src/components/QRUpload.jsx` | `VMobileUpload` | `kiosk-pages-personal.jsx` |
| **Voice assistant overlay** | `src/components/VoiceNavigation.jsx`, `src/ai/provider/VoiceAssistantProvider.jsx` | `VVoice` | `kiosk-pages-personal.jsx` |
| **Emergency / SOS** | `src/components/EmergencyQuickAccess.jsx`, `EmergencyAlertBanner.jsx` | `VSOS` | `kiosk-pages-personal.jsx` |

## Weather + AQI status row (new global feature)

A second header strip sits below the brand bar on every screen. It surfaces:

| Slot | Content | Source |
|---|---|---|
| Weather | City · condition · temperature (°C) · "feels like" | OpenWeatherMap / IMD API |
| AQI | CPCB AQI value · band (Good / Satisfactory / Moderate / Poor / Very Poor / Severe) | CPCB SAFAR API or `data.gov.in` AQI dataset |
| Clock | Date + time (mono digits) | Device clock, IST |
| Connectivity | Wi-Fi / Ethernet status pip | Browser `navigator.onLine` + heartbeat |

### Token-level rules

The AQI band determines the colour treatment of the AQI tile:

```js
function aqiBand(v) {
  if (v <= 50)  return { label: 'Good',          tone: 'good', color: 'var(--ok)' };
  if (v <= 100) return { label: 'Satisfactory',  tone: 'good', color: 'var(--ok)' };
  if (v <= 200) return { label: 'Moderate',      tone: 'mod',  color: 'oklch(0.74 0.15 75)' };
  if (v <= 300) return { label: 'Poor',          tone: 'poor', color: 'var(--err)' };
  if (v <= 400) return { label: 'Very Poor',     tone: 'poor', color: 'var(--err)' };
  return            { label: 'Severe',           tone: 'poor', color: 'var(--err)' };
}
```

### Behaviour

- **Refresh cadence:** weather every 15 min, AQI every 30 min (CPCB updates hourly anyway). Cache last value to localStorage for offline display + show a faded "as of HH:MM" sub-line if data is older than the cadence × 2.
- **AQI advisories:** when AQI ≥ 101 (Moderate or worse), the **Dashboard** and **Healthcare** pages must surface a respiratory advisory card linking to `Healthcare`. Pattern shown in `VDashboard` and `VHealth`.
- **Health hooks (planned later):** AQI ≥ 201 (Poor or worse) triggers a passive banner suggesting mask use; if a user has registered themselves or a family member as asthmatic/elderly in `FamilyProfile`, the banner becomes a top-of-screen alert.
- **Reduced motion:** the status row never animates — values change with no transition, so users glancing up don't get distracted.

### Files implementing this

- `kiosk-shell.jsx` — `StatusRow`, `aqiBand`, `VK` shell wires the row in by default
- CSS: `.vk-status`, `.stat`, `.stat-weather`, `.stat-aqi-good|mod|poor`, `.stat-clock`, `.stat-net` (all in `SUVIDHA Vertical Kiosk v2.html`)

## Interactions & Behavior

### Global

- **Tap targets:** chips/secondary 56px · default 80px · primary CTA 80–110px · keypad 110×110 · OTP 88×110
- **No hover states** — use `:active` (scale 0.97, brief tint)
- **Animation timing:** 80ms press · 150ms select · 250ms screen transition
- **Idle timeout:** redirect to Landing after 90s; show "Are you still there?" modal at 80s with 10s countdown
- **Auto-clear PII:** wipe session + form state on logout / idle return
- **RTL:** Urdu/Arabic-script languages flip; existing repo's `RTL_LANGS` in `i18n/languageCodes.js` already handles this
- **Min readable text:** 16px; bump 1.2× for Elderly mode

### Per-flow specifics

(unchanged from v1 — see "Interactions" section of the v1 handoff that already lives at `design_handoff_suvidha_kiosk/README.md` in the v1 project)

### New flows (v2)

| Flow | Behaviour |
|---|---|
| **Dashboard** | Polls `/me/requests?status=active` every 30s. Bills pulled from `/me/bills?due=true`. Quick actions are deep links into the relevant flow. |
| **Profile** | Read-only by default; tap **Edit** unlocks an inline edit mode using on-screen keyboard. Linked-services list comes from `/me/linked-accounts`. |
| **Family** | Add member opens a sub-flow: link by Aadhaar (OTP consent) or by birth certificate (Aadhaar of guardian + child's name + DOB). Combined eligibility banner counts schemes from `/schemes/match?family=true`. |
| **Gas bill** | Single-screen pay flow; primary CTA opens UPI bottom-sheet (PhonePe / GPay / BHIM). Card/NetBanking are alternates. On success → `VReceipt`. |
| **Property tax** | Pulls assessment from `/properties/:id/assessment?fy=2026-27`. "Pay full" or "Part pay" (min ₹1,000). Same pay sheet as gas. |
| **Water** | 6-month sparkline from `/me/water/usage?months=6`. Bill from `/me/water/bill`. |
| **Sanitation** | Today's pickup card uses live truck position from `/sanitation/route?ward=14` if available; otherwise falls back to a schedule-only view. Report missed pickup auto-attaches GPS + last-bin-photo. |
| **Healthcare** | Hospital list polls `/hospitals/nearby?lat=&lon=` every 60s for OPD wait times. PMJAY card e-card opens at `/me/pmjay/qr`. |
| **Transport** | Pulls outstanding e-challans from `/me/challans`. DL card pulls from `/me/dl`. Pay challan → UPI sheet. |
| **Mobile upload** | When user opens flow, kiosk generates a session token, displays QR linking to `suvidha.gov.in/u/<sessionToken>`. Token TTL 5 min. Kiosk listens via WebSocket / SSE for upload events and updates the doc list live. |
| **Voice overlay** | Uses existing `VoiceAssistantProvider`. Dark indigo background, large saffron mic with concentric pulse, live transcript at top, suggestion chips at bottom. Wake word "SUVIDHA" still active in background; tap mic or say "stop" to dismiss. |
| **SOS** | Buttons place call via Web Telephony if available, else show the number with a "Dial on phone" QR. Location card pre-fills an SMS template to a saved family contact. |

## State Management

```ts
type AppState = {
  auth: {
    aadhaarLast4?: string;
    citizenName?: string;
    profile?: CitizenProfile;
    mode: 'guest' | 'citizen';
    accessibility: 'normal' | 'elderly' | 'blind';
  };
  language: 'en' | 'hi' | 'as' | 'bn' | 'ta' | /* … */;
  // NEW in v2:
  environment: {
    city: string;            // 'Guwahati'
    weather: { temp: number; feelsLike: number; condition: string; iconKey: 'sun'|'cloud'|'cloudsun'; fetchedAt: number };
    aqi: { value: number; band: 'good'|'sat'|'mod'|'poor'|'verypoor'|'severe'; fetchedAt: number };
    online: boolean;
  };
  // existing:
  currentFlow?: { dept: string; service: string; step: number; data: Record<string, any> };
  requests: Request[];
  schemes: Scheme[];
  family: FamilyMember[];
  notifications: Notification[];
};
```

- Per-screen forms: **React Hook Form**
- Server state: **TanStack Query** (already in repo)
- Persistent kiosk settings (language, accessibility, last-known weather/AQI): **localStorage**
- Per-session citizen data: **sessionStorage** (cleared on logout / idle)

## Backend Endpoints

In addition to the v1 endpoints (see v1 handoff), v2 adds:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/env/weather?city=Guwahati` | Current weather (°C, condition, icon key) |
| `GET` | `/env/aqi?city=Guwahati` | Current CPCB AQI value + band |
| `GET` | `/me/dashboard` | Aggregated dashboard payload (active requests, bills, alerts) |
| `GET` | `/me/profile` / `PATCH` | Profile read + update |
| `GET` | `/me/family` / `POST` | Family list + link member |
| `GET` | `/me/bills?dept=&due=true` | Bills due |
| `GET` | `/me/water/usage?months=6` | Water consumption sparkline |
| `GET` | `/me/water/bill` | Current water bill |
| `GET` | `/me/dl` | Digital DL card |
| `GET` | `/me/challans` | Outstanding e-challans |
| `POST` | `/challans/:id/pay` | Initiate UPI pay |
| `GET` | `/me/pmjay/qr` | Ayushman e-card QR |
| `GET` | `/hospitals/nearby?lat=&lon=` | Hospitals + OPD wait |
| `GET` | `/sanitation/route?ward=14` | Today's pickup truck position + ETA |
| `POST` | `/sanitation/missed-pickup` | Report w/ photo + GPS |
| `POST` | `/upload/session` | Returns `{ sessionToken, qrUrl, expiresIn }` for mobile companion |
| `GET` | `/upload/session/:token/events` (SSE) | Stream upload events |

## Files in this handoff

```
design_handoff_suvidha_vertical_kiosk/
├── README.md                                  ← This file
├── tokens.md                                  ← Full design tokens (colors, type, spacing, radii, shadows, icons)
└── designs/
    ├── Vertical Kiosk Designs v1.html         ← Open: 12 original screens
    ├── vertical-pages-v1.jsx                  ← React source for v1 screens
    ├── SUVIDHA Vertical Kiosk v2.html         ← Open: 14 new screens + status row
    ├── kiosk-shell.jsx                        ← Shared shell (VK + StatusRow + icons)
    ├── kiosk-pages-personal.jsx               ← Dashboard, Profile, Family, MobileUpload, Voice, SOS
    ├── kiosk-pages-services.jsx               ← Gas, Municipal, Water, PropertyTax, Health, Transport, Sanitation
    ├── kiosk-pages-system.jsx                 ← (intentionally empty placeholder; safe to delete)
    ├── kiosk-app.jsx                          ← v2 design-canvas composer
    └── design-canvas.jsx                      ← Design exploration shell (don't ship)
```

`design-canvas.jsx` and `kiosk-pages-system.jsx` are tooling — don't ship them.

## Implementation Order

1. **Port tokens** — add `tokens.md` values to `tailwind.config.js` (replace the existing `india.*` and `government.*` palettes with `indigo-*`, `saffron-*`, `dept-*`)
2. **Force portrait viewport** — meta tag + PWA manifest `orientation: "portrait-primary"` + a CSS `@media (orientation: landscape)` warning overlay
3. **Layout primitives** — `VK` (chrome wrapper), `StatusRow`, `Tile`, `Card`, `Badge`, `Button`, `Field`, `Keypad`, `OTPInput`, `Timeline`, `BottomActionBar` — match the JSX in `kiosk-shell.jsx`
4. **Logo + icons** — swap inline `ic` map to `lucide-react` per `tokens.md` mapping
5. **Weather + AQI infra** — small `useEnvironment()` hook backed by `/env/weather` + `/env/aqi`, cached in localStorage; render via `StatusRow`
6. **Auth flow** (v1 screens) — Landing → Aadhaar → OTP → Mode → Home
7. **Dashboard** — most important post-login surface, drives every other entry point
8. **Department flows** — Electricity (canonical) → Gas → Water → Municipal/Property Tax → Sanitation → Health → Transport
9. **Complaints, Schemes, Locator** (v1)
10. **Profile + Family** (v2)
11. **Mobile upload** (uses existing `QRUpload.jsx` + `FileUpload.jsx`, restyle to v2 layout)
12. **Voice overlay** — reuse `VoiceAssistantProvider` from existing repo, restyle to match `VVoice`
13. **SOS + Emergency** — reuse `EmergencyQuickAccess.jsx`, restyle to match `VSOS`
14. **i18n** — verify `react-i18next` keys exist for every new page in all 22+ languages
15. **Accessibility audit** — WCAG 2.1 AA; test Normal / Elderly / Blind modes

## Key Differences vs Existing Repo

| Concern | Existing | Target (this handoff) |
|---|---|---|
| Orientation | Landscape / responsive | **Portrait 1080×1920 locked** |
| Type scale | ~14–24px body | 16–24px body, 36–96px headings (1.5× bumped) |
| Tap targets | ~48px | 56–110px |
| Palette | `india.saffron` `#FF9933`, `government.blue` `#003366` | `indigo-700` `oklch(0.38 0.13 270)` + `saffron-500` `oklch(0.74 0.15 65)` |
| Layout columns | 3–4 col | 1–2 col |
| Logo | Existing emblem | "Radiant Arch" SUVIDHA mark (SVG in `kiosk-shell.jsx`) |
| Top chrome | Single brand row | Brand row **+ new Status row** (weather/AQI/clock/net) |
| Bottom bar | Hidden behind menus | Persistent A+ / Voice / **EMERGENCY** on every page |
| Tricolor strip | Absent | 10px band at the very top of every screen |

## Production Notes

- **PWA** — `manifest.json` with `display: "fullscreen"`, `orientation: "portrait-primary"`, kiosk lockdown via Chromium `--kiosk` flag
- **Offline-first** — existing IndexedDB queue stays; weather + AQI must fall back to last-known cached value when offline, with an "as of HH:MM" sub-line
- **Auto-update** — service worker `skipWaiting + clientsClaim`; nightly low-traffic update window
- **Hardware** — printer via WebUSB / local print server; biometrics via local WebSocket bridge
- **Audit logging** — every txn logged with Aadhaar last-4, timestamp, screen, action (no full PII)
- **Privacy** — DPDP Act 2023: explicit consent before Aadhaar lookup; auto-wipe session on idle; no PII in client-side logs

## Quick map: design components ↔ existing components in the repo

Use this when restyling rather than rebuilding from scratch:

| Design (this handoff) | Repo file to restyle |
|---|---|
| `VK` shell | `src/components/Header.jsx` + a new layout wrapper |
| `StatusRow` | **New component** — `src/components/StatusRow.jsx` |
| `Logo` (Radiant Arch) | Replace existing logo asset / SVG |
| `Tile` / `card` / `btn` | `src/components/Card.jsx`, `Button.jsx` |
| Keypad | `src/components/NumericKeypad.jsx` |
| Timeline | `src/components/Timeline.jsx` |
| QR upload | `src/components/QRUpload.jsx` + `FileUpload.jsx` + `FilePreviewModal.jsx` |
| Voice overlay | `src/components/VoiceNavigation.jsx` + `src/ai/provider/VoiceAssistantProvider.jsx` |
| Emergency | `src/components/EmergencyQuickAccess.jsx`, `EmergencyAlertBanner.jsx` |
| Accessibility toolbar (A+, voice) | `src/components/AccessibilityToolbar.jsx`, `AccessibilityProvider.jsx` |
| Dashboard | `src/pages/Dashboard.jsx` |
| Profile / Family | `src/pages/ConsumerProfile.jsx`, `FamilyProfile.jsx`, `src/components/DependentCard.jsx` |
| Office locator | `src/pages/OfficeLocator.jsx`, `src/components/RealtimeNavigationMap.jsx` |

When in doubt, prefer **restyling an existing component** over rewriting it. The repo's wiring (i18n, voice, accessibility, file upload, IndexedDB queue) stays; only the visual layer changes.
