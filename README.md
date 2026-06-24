# SUVIDHA 2026

**Smart Urban Digital Helpdesk Assistant**

SUVIDHA is a public-service kiosk application for citizen access to civic services, welfare schemes, emergency help, document upload, status tracking, and department/admin operations. The current codebase is a full-stack demo: a React kiosk UI, Express/SQLite backend, multilingual voice assistant, secure upload flow, admin portals, organization portals, and Playwright kiosk tests.

**Live Demo:** https://suvidha-2026-iota.vercel.app

---

## Current Capabilities

- **Vertical kiosk experience:** 2160px-wide fixed viewport shell for public touch terminals, with large touch targets and department-first navigation.
- **Citizen entry flows:** guest access, Aadhaar lookup, OTP verification, QR/DigiLocker-style demo verification, biometric demo verification, Gas CA/legacy number login, and Municipal consumer/property ID login.
- **Primary department menus:** Electricity, Assam Gas, and Municipal service menus, with additional Healthcare, Transport, Sanitation, Schemes, Family Profile, Track Status, and Office Locator flows.
- **Department workflows:** electricity connection/complaint/profile routes, gas connection/complaint/bill routes, municipal water/grievance/property-tax routes, generic service forms, complaint registration, receipt generation, and status tracking.
- **AI assistant:** floating citizen chatbot, multilingual intent handling, voice assistant provider, local STT fallback modules, TTS service, wake/voice navigation support, ad Sarvam/NVIDIA/HuggingnFace fallback plumbing on the backend.
- **Indian-language support:** static i18n bundles for 23 languages plus language metadata for Sarvam-supported and bridged languages.
- **Accessibility:** normal, blind, and elderly modes; screen reader overlay for blind mode; high-contrast/font controls; voice-first navigation paths; session-level mode persistence.
- **Emergency layer:** always-visible alert banner and quick SOS access, independent of the current route.
- **Offline/PWA layer:** service worker, manifest, IndexedDB/local fallback utilities, offline indicator, upload/session utilities, and sync API route.
- **QR phone upload:** secure mobile upload route at `/upload/:token` backed by server upload and upload-public APIs.
- **Admin and enterprise operations:** admin login with employee ID/email + MFA, super admin, kiosk ops, department/officer, security, audit, organization portals, and real-time Socket.IO server wiring.
- **Security layers:** Helmet CSP, rate limiting, CORS policy, JWT auth, refresh tokens for admin sessions, input sanitization, CSRF middleware for enterprise routes, audit logging, upload validation, and SQLite WAL mode.

---

## Demo Data

### Citizen / Kiosk

The app supports guest access from the landing screen. For demo citizen login, use the seeded Aadhaar records in the backend:

| Aadhaar UID  | Name          | Mobile     | Notes |
|--------------|---------------|------------|-------|
| `999988887777` | Rajesh Kumar  | `9486635346` | Tamil citizen |
| `111122223333` | Kamala Devi   | `7904802849` | Elderly Hindi citizen |
| `444455556666` | Arun Patil    | `9988776655` | Visual disability profile |
| `777788889999` | Sneha Reddy   | `9090909090` | Child/student profile |
| `222233334444` | Meera Shah    | `9111222333` | Physical disability profile |
| `123412341234` | Admin User    | `9000000001` | Legacy admin citizen record |

Alternative login demos on the login screen:

| Flow | Demo IDs | OTP |
|------|----------|-----|
| Gas CA / legacy number | `CA-001234`, `CA-GHY-2024`, `LN-45678` | `123456` |
| Municipal consumer/property ID | `MC-001`, `WC-GHY-2025`, `PT-009876` | `123456` |

Tracking demos:

- Request IDs: `SVD-TEST-001`, `SVD-TEST-002`
- Mobile: `9876543210`

### Admin

Admin login is available at `/admin-login`.

| Role | Employee ID | Email | Password | Dev MFA |
|------|-------------|-------|----------|---------|
| Super Admin | `EMP-SUPER-001` | `super.admin@suvidha.gov.in` | `Admin@2026!` | `123456` |
| Kiosk Admin | `EMP-KIOSK-001` | `kiosk.admin@suvidha.gov.in` | `Admin@2026!` | `123456` |

Additional seeded organization/admin users are created by `server/enterprise/schema.js`.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 6, React Router 7 |
| Styling | Tailwind CSS 3, custom kiosk design tokens |
| State | React Context, sessionStorage, localStorage |
| Maps | MapLibre GL, Leaflet |
| AI/Voice | Web Speech APIs, Sarvam AI routes, NVIDIA API route support, HuggingFace transformer dependency |
| Backend | Express 4, better-sqlite3, Socket.IO |
| Security | Helmet, JWT, bcrypt, rate limiting, CSRF middleware, audit logging |
| Uploads | Multer, QR upload sessions, public token upload route |
| PWA/Offline | Service worker, manifest, IndexedDB/local fallback utilities |
| Testing | Playwright |
| Deployment | Vercel SPA rewrite for frontend; backend runs separately for local/full-stack mode |

---

## Quick Start

Install dependencies:

```powershell
npm install
cd server
npm install
cd ..
```

Create environment files:

```powershell
Copy-Item .env.example .env
Copy-Item .env.example server\.env
```

Start the backend API:

```powershell
cd server
npm run dev
```

In a second terminal, start the kiosk UI:

```powershell
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api`
- Health check: `http://localhost:8080/api/health`

The Vite dev server proxies `/api` and `/socket.io` to the backend on port `8080`.

---

## Environment Variables

Frontend variables use Vite's `VITE_` prefix:

```env
VITE_API_BASE_URL=/api
VITE_MAPTILER_KEY=your_maptiler_key
```

Backend variables are read from `server/.env`:

```env
PORT=8080
NODE_ENV=development
JWT_SECRET=change-me
ADMIN_JWT_SECRET=change-me
ADMIN_REFRESH_SECRET=change-me
DEFAULT_ADMIN_PASSWORD=Admin@2026!
DEV_ADMIN_MFA_CODE=123456
SARVAM_API_KEY=your_sarvam_key
NVIDIA_API_KEY=your_nvidia_key
HF_TOKEN=your_huggingface_token
FAST2SMS_API_KEY=your_fast2sms_key
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

The app still runs in demo mode without most API keys, but voice, chat, translation, and real SMS delivery are limited.

---

## Main Routes

### Citizen/Kiosk

| Route | Purpose |
|-------|---------|
| `/` | Landing screen |
| `/login` | Aadhaar, CA/legacy, and consumer ID login |
| `/language-select` | Language selection |
| `/voice-select` | Voice mode selection |
| `/mode-select` | Accessibility mode selection |
| `/home` | Department/service hub |
| `/electricity-menu`, `/electricity`, `/electricity/complaint`, `/electricity/consumer` | Electricity flows |
| `/gas-menu`, `/gas`, `/gas/complaint`, `/gas/bills` | Gas flows |
| `/municipal-menu`, `/municipal`, `/municipal/grievance`, `/municipal/property-tax` | Municipal flows |
| `/water`, `/sanitation`, `/transport`, `/healthcare` | Additional service forms |
| `/complaints` | Civic complaint registration |
| `/schemes` | Scheme discovery |
| `/office-locator` | Government office locator |
| `/family-profile` | Dependents/family profile |
| `/track-status` | Request/ticket tracking |
| `/receipt` | Printable receipt |
| `/upload/:token` | Mobile document upload |

### Admin/Enterprise

| Route | Purpose |
|-------|---------|
| `/admin-login` | Employee/admin login with MFA |
| `/admin/super` | Legacy super admin dashboard |
| `/admin/kiosk` | Legacy kiosk ops dashboard |
| `/admin/department` | Department dashboard |
| `/admin/officer` | Officer workspace |
| `/admin/security` | Security dashboard |
| `/admin/audit` | Audit dashboard |
| `/super-admin` | Enterprise super admin portal |
| `/kiosk-ops` | Enterprise kiosk operations |
| `/security/ops` | Security operations center |
| `/security/audit` | Security audit trail |
| `/org/electricity`, `/org/water`, `/org/healthcare`, `/org/municipal`, `/org/transport`, `/org/revenue` | Organization portals |

---

## Backend API Areas

The backend lives in `server/` and initializes `server/suvidha.db` automatically.

| API Prefix | Purpose |
|------------|---------|
| `/api/auth` | Aadhaar lookup, QR verification, biometric demo verification |
| `/api/otp` | OTP send/verify |
| `/api/admin-auth` | Admin login, MFA, refresh, logout, profile |
| `/api/service-requests` | Protected citizen service submissions |
| `/api/complaints` | Protected complaint submission |
| `/api/transport` | Transport ticket/pass flow |
| `/api/track` | Public tracking lookup |
| `/api/schemes` | Scheme discovery data |
| `/api/offices` | Office locator data |
| `/api/alerts` | Emergency/public alerts |
| `/api/upload`, `/api/upload-public` | Authenticated and tokenized upload flows |
| `/api/notifications` | SMS/WhatsApp receipt notification logging |
| `/api/sync` | Offline sync endpoint |
| `/api/sarvam` | Sarvam voice/translation support |
| `/api/chat` | AI chatbot endpoint |
| `/api/kiosk-admin`, `/api/org-portals`, `/api/super-admin`, `/api/security-center` | Enterprise admin APIs |
| `/api/health` | Health check |

---

## Project Structure

```text
kiosk-hackathon-2026/
  src/
    App.jsx                         Route tree and global kiosk shell
    main.jsx                        React entry point with Auth/Toast providers
    index.css                       Tailwind + kiosk styling
    ai/                             Voice assistant, STT/TTS, intent routing, chatbot brain
    assets/icons/                   Department SVG/icon components
    components/                     Shared UI, emergency, accessibility, upload, voice, chatbot
    components/kiosk/               Vertical kiosk primitives and keypad controls
    context/                        Auth, session, and toast contexts
    data/                           Office data
    design/                         CSS design tokens/primitives
    hooks/                          Auth, environment, scaling, toast, voice form hooks
    i18n/                           23 locale JSON files and i18next setup
    pages/                          Citizen, admin, security, kiosk ops, and organization pages
    utils/                          API clients, auth helpers, security, offline, TTS, receipts

  server/
    index.js                        Express app, middleware, route mounting, Socket.IO
    db.js                           SQLite tables and seed data
    enterprise/                     Enterprise schema, token/routing/audit services
    middleware/                     Auth, CSRF, audit, isolation, observability, upload validation
    routes/                         Public, citizen, admin, enterprise, AI, upload APIs
    services/                       Admin auth, audit, SMS, language routing, routing engine
    socket/                         Realtime server
    sql/                            MySQL enterprise schema reference

  public/
    manifest.json                   PWA manifest
    sw.js                           Service worker

  docs/
    reports/                        Evaluation, compliance, threat model, implementation reports
    kiosk-design/                   Kiosk design tokens and reference designs

  tests/
    kiosk.spec.js                   Playwright kiosk smoke/regression tests
```

---

## Testing

Run the frontend and backend first, then:

```powershell
npx playwright test
```

The Playwright config uses a kiosk-style Chromium project and writes screenshots/reports under `removable/test-results/`.

Build check:

```powershell
npm run build
```

Backend health check:

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

---

## Architecture Snapshot

```text
React kiosk UI (Vite, port 3000)
  |
  |-- AuthProvider, SessionProvider, AccessibilityProvider, VoiceAssistantProvider
  |-- EmergencyAlertBanner, EmergencyQuickAccess
  |-- VoiceNavigation, ScreenReaderOverlay, AIChatbot
  |-- Citizen routes, admin routes, enterprise organization portals
  |
  |  /api and /socket.io proxy
  v
Express backend (port 8080)
  |
  |-- Helmet, CORS, rate limits, sanitization, audit logging
  |-- JWT citizen/admin auth, admin MFA, refresh tokens
  |-- Service, complaint, upload, tracking, schemes, offices, alerts
  |-- Sarvam/chat routes and Socket.IO realtime server
  v
SQLite database (server/suvidha.db)
  |
  |-- Citizens, service requests, complaints, uploads, notifications
  |-- Admin users, roles, permissions, sessions, audit/security data
```

---

## Notes for Reviewers

- This is a hackathon demo codebase with seeded citizen/admin data and simulated Aadhaar/biometric flows.
- Real production deployment must replace demo secrets, demo OTP/MFA, mock Aadhaar records, local SQLite storage, and simulated biometric/QR behavior with certified integrations.
- The frontend can deploy as a static SPA, but the full feature set expects the Express backend and API keys for voice/chat/SMS services.

---

## Team

SASTRA Deemed University, Thanjavur, Tamil Nadu

4 Members
