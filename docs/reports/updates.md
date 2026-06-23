# SUVIDHA Kiosk — Backend Implementation Updates

## Overview

A complete **Express.js + SQLite** backend has been added to the project, replacing all mock `setTimeout`-based API calls with real HTTP endpoints. The frontend still works without the backend (graceful degradation with fallback to local mock data).

---

## New Files Created

### Backend Server (`server/`)

| File | Description |
|------|-------------|
| `server/package.json` | Backend dependencies — Express, better-sqlite3, JWT, multer, cors, uuid, bcryptjs |
| `server/index.js` | Main Express server (port 8080) with CORS, 12 route mounts, health check, error handler |
| `server/db.js` | SQLite schema (11 tables) + seed data (6 citizens, 2 tracking records, 16 offices, 2 alerts, 10 schemes) |

### API Route Handlers (`server/routes/`)

| File | Endpoints | Description |
|------|-----------|-------------|
| `auth.js` | `POST /api/auth/aadhaar/lookup`, `send-otp`, `verify-otp`, `verify-biometric` | Aadhaar-based authentication with OTP and JWT tokens |
| `services.js` | `POST /api/service-requests`, `GET /:requestId`, `GET /` | Service request submission (electricity, gas, water, etc.) |
| `complaints.js` | `POST /api/complaints`, `GET /:complaintId` | Complaint registration with AI department classification |
| `transport.js` | `POST /api/transport/book-ticket`, `GET /tickets/:ticketId` | Transport ticket booking with fare calculation |
| `track.js` | `GET /api/track?requestId=` or `?mobile=` | Track request status with full timeline |
| `schemes.js` | `POST /api/schemes/discover`, `GET /api/schemes` | AI-powered scheme matching based on citizen profile |
| `offices.js` | `GET /api/offices?state=&city=&ward=&serviceType=` | Government office locator with filters |
| `admin.js` | `GET /api/admin/analytics`, `/applications`, `/grievances/stats`, `PUT approve/reject` | Admin dashboard analytics and approval workflows |
| `alerts.js` | `GET /api/alerts/emergency`, `POST /api/alerts/emergency` | Emergency alert management (IMD, NDMA feeds) |
| `upload.js` | `POST /api/upload`, `POST /:sessionId/files`, `GET /:sessionId/status` | File upload (session-based, multer, max 5MB) |
| `notifications.js` | `POST /api/notifications/send-receipt` | SMS/WhatsApp receipt notification logging |
| `reference.js` | `GET /api/reference/states`, `/cities`, `/wards`, `/service-categories`, `/complaint-types` | Reference data (mirrors frontend constants) |
| `sync.js` | `POST /api/sync/pending` | Offline sync — batch replay queued IndexedDB submissions |

### Frontend API Service Layer

| File | Description |
|------|-------------|
| `src/utils/apiService.js` | Axios-based API client with CSRF token interceptor, all endpoint methods exported |

---

## Modified Files

### Vite Configuration

- **`vite.config.js`** — Added dev proxy rules: `/api` → `http://localhost:8080`, `/uploads` → `http://localhost:8080`

### Utility Files

- **`src/utils/aadhaarDatabase.js`** — All 4 auth functions (`lookupAadhaar`, `sendAadhaarOTP`, `verifyAadhaarOTP`, `verifyBiometric`) now call real backend via `authAPI` with try/catch fallback to original local mock data
- **`src/utils/api.js`** — `mockAPI` object now calls real backend (`serviceAPI.submit`, `trackAPI.byRequestId`, `authAPI`) with try/catch fallback to original setTimeout mock behavior

### Service Pages (6 pages — identical pattern)

Each page's `handleConfirmSubmit` was updated from:
```jsx
await new Promise(resolve => setTimeout(resolve, 2000));
const requestId = generateRequestId();
```
To:
```jsx
const result = await serviceAPI.submit({ serviceType, serviceCategory, ... });
const requestId = result.requestId;
// Fallback: generateRequestId() if backend unavailable
```

| File | Service Type |
|------|-------------|
| `src/pages/Electricity.jsx` | `electricity` |
| `src/pages/Gas.jsx` | `gas` |
| `src/pages/Water.jsx` | `water` |
| `src/pages/Sanitation.jsx` | `sanitation` |
| `src/pages/Municipal.jsx` | `municipal` |
| `src/pages/Healthcare.jsx` | `healthcare` |

### Other Page Updates

| File | Change |
|------|--------|
| `src/pages/Complaints.jsx` | `handleConfirmSubmit` → calls `complaintAPI.submit()` with fallback |
| `src/pages/Transport.jsx` | `handleBookTicket` → calls `transportAPI.bookTicket()`, `handleConfirmSubmit` → calls `serviceAPI.submit()` |
| `src/pages/TrackStatus.jsx` | `handleSearch` → calls `trackAPI.byRequestId()` / `trackAPI.byMobile()` with fallback to `mockTrackingData` |
| `src/pages/SchemeDiscovery.jsx` | `handleDiscover` → calls `schemeAPI.discover()` with fallback to client-side matching |
| `src/pages/OfficeLocator.jsx` | `handleSearch` → calls `officeAPI.search()` with fallback to local `filterOffices()` |

### Component Updates

| File | Change |
|------|--------|
| `src/components/EmergencyAlertBanner.jsx` | `useEffect` → fetches from `alertAPI.getEmergency()` with fallback to `MOCK_ALERTS` |
| `src/components/SendToPhone.jsx` | `handleSend` → calls `notificationAPI.sendReceipt()` with graceful fallback |

---

## Architecture

```
┌─────────────────────┐      Vite Proxy       ┌─────────────────────┐
│   React Frontend    │  ──── /api ──────────► │   Express Backend   │
│   localhost:3000    │  ──── /uploads ──────► │   localhost:8080    │
│                     │                        │                     │
│  apiService.js      │                        │  routes/ (12 files) │
│  (axios + CSRF)     │                        │  db.js (SQLite)     │
└─────────────────────┘                        └─────────────────────┘
                                                       │
                                                  suvidha.db
                                               (auto-created)
```

### Key Design Decisions

1. **SQLite** — Zero-config, no external database server needed. Single-file `suvidha.db` auto-created on first run
2. **Graceful Degradation** — Every frontend API call wraps the real backend call in try/catch, falling back to original mock behavior. The app works 100% without the backend
3. **Auto-seeding** — Database seeds 6 Aadhaar citizens, 16 government offices, 10 welfare schemes, 2 emergency alerts, and 2 tracking records on first startup
4. **JWT Auth** — Login returns a JWT token (30-day expiry) after Aadhaar OTP/biometric verification
5. **Request ID Formats** — Preserved the frontend patterns: `SVD-XXXXXXXX-XXXX` for services, `CMP-YYYYMMDD-XXXXX` for complaints, `TKT-SVD-XXX` for transport
6. **i18n** — All seeded data includes Hindi and Tamil translations

---

## How to Run

### Start the Backend
```bash
cd server
npm install   # first time only
npm start     # or: npm run dev (with --watch)
```

### Start the Frontend (separate terminal)
```bash
npm run dev
```

The Vite dev server on port 3000 proxies `/api/*` requests to the backend on port 8080.

### Seeded Test Data

| Aadhaar UID | Name | Role |
|-------------|------|------|
| `999988887777` | Rajesh Kumar | Citizen (Chennai) |
| `111122223333` | Kamala Devi | Citizen (Delhi, Senior) |
| `444455556666` | Arun Patil | Citizen (Mumbai, Visual disability) |
| `777788889999` | Sneha Reddy | Citizen (Bengaluru, Student) |
| `222233334444` | Meera Shah | Citizen (Ahmedabad, Physical disability) |
| `123412341234` | Admin User | Admin (Delhi) |

### Tracking Test Data

| Request ID | Status |
|-----------|--------|
| `SVD-TEST-001` | In Progress (Electricity) |
| `SVD-TEST-002` | Resolved (Water) |

---

## Database Schema (11 tables)

| Table | Purpose |
|-------|---------|
| `citizens` | Aadhaar citizen records (6 seeded) |
| `service_requests` | All service submissions |
| `complaints` | Complaint registrations |
| `transport_tickets` | Bus/metro/train bookings |
| `timeline_events` | Status history for tracking |
| `schemes` | Government welfare schemes (10 seeded) |
| `offices` | Government office locations (16 seeded) |
| `alerts` | Emergency alerts (2 seeded) |
| `uploads` | File upload records |
| `notifications` | SMS/WhatsApp notification log |
| `otp_store` | Temporary OTP storage (5-min expiry) |

---

## API Endpoints Summary (26 total)

| Method | Endpoint | Auth Required |
|--------|----------|--------------|
| GET | `/api/health` | No |
| GET | `/api/csrf-token` | No |
| POST | `/api/auth/aadhaar/lookup` | No |
| POST | `/api/auth/aadhaar/send-otp` | No |
| POST | `/api/auth/aadhaar/verify-otp` | No |
| POST | `/api/auth/aadhaar/verify-biometric` | No |
| POST | `/api/service-requests` | No |
| GET | `/api/service-requests/:requestId` | No |
| GET | `/api/service-requests` | No |
| POST | `/api/complaints` | No |
| GET | `/api/complaints/:complaintId` | No |
| POST | `/api/transport/book-ticket` | No |
| GET | `/api/transport/tickets/:ticketId` | No |
| GET | `/api/track` | No |
| POST | `/api/schemes/discover` | No |
| GET | `/api/schemes` | No |
| GET | `/api/offices` | No |
| GET | `/api/admin/analytics` | No |
| GET | `/api/admin/applications` | No |
| GET | `/api/admin/grievances/stats` | No |
| PUT | `/api/admin/applications/:id/approve` | No |
| PUT | `/api/admin/applications/:id/reject` | No |
| GET | `/api/alerts/emergency` | No |
| POST | `/api/alerts/emergency` | No |
| POST | `/api/upload` | No |
| POST | `/api/upload/:sessionId/files` | No |
| GET | `/api/upload/:sessionId/status` | No |
| POST | `/api/notifications/send-receipt` | No |
| GET | `/api/reference/states` | No |
| GET | `/api/reference/cities` | No |
| GET | `/api/reference/wards` | No |
| GET | `/api/reference/service-categories` | No |
| GET | `/api/reference/complaint-types` | No |
| POST | `/api/sync/pending` | No |

---

## What Was NOT Changed

- **No frontend UI/UX changes** — All components render identically
- **No routing changes** — All React Router paths unchanged
- **No i18n changes** — Translation files untouched
- **No Tailwind/CSS changes** — Styling untouched
- **No dependency changes to frontend** — `axios` was already in `package.json`
- **Mock data preserved** — All `MOCK_ALERTS`, `mockSchemes`, `mockTrackingData`, `officeData` arrays kept as offline fallbacks
