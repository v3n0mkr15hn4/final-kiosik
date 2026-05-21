# SUVIDHA 2026 — Threat Model (STRIDE Analysis)

## 1. Asset Inventory

| Asset | Sensitivity | Location |
|-------|------------|----------|
| Aadhaar UIDs | **Critical** — PII under DPDP Act 2023 | Frontend sessionStorage, backend SQLite |
| Citizen names, addresses, phone numbers | **High** | Backend SQLite, frontend sessionStorage |
| JWT authentication tokens | **High** | Frontend sessionStorage, HTTP headers |
| OTP codes | **High** (short-lived) | Backend SQLite `otp_store`, console log |
| Service request data | **Medium** | Backend SQLite `service_requests` |
| Complaint data + photos | **Medium** | Backend SQLite + filesystem |
| Admin credentials | **Critical** | Backend SQLite (bcrypt-hashed) |

---

## 2. STRIDE Threat Enumeration

### S — Spoofing (Identity)

| Threat | Risk | Mitigation |
|--------|------|------------|
| Attacker impersonates citizen | High | Aadhaar-based 2FA: OTP to registered mobile + biometric verification |
| Stolen/replayed JWT token | Medium | JWT expiry (2h), session fingerprinting (UA + screen + timezone), inactivity auto-logout (5min) |
| Brute-force OTP guessing | Medium | 6-digit OTP (1M combinations), rate limiting (10 auth attempts/15min), OTP expires in 5 minutes |
| Fake admin access | High | `requireAdmin` middleware checks JWT `isAdmin` claim, admin login requires bcrypt password |

### T — Tampering

| Threat | Risk | Mitigation |
|--------|------|------------|
| XSS injection in form fields | High | HTML entity encoding (`sanitizeInput`), tag stripping (`stripHtml`), `sanitizeFormData()` on all inputs |
| CSRF attacks on state-changing endpoints | Medium | CSRF token in `X-CSRF-Token` header, generated via `crypto.getRandomValues()` |
| File upload of malicious executables | Medium | MIME type validation, 5MB limit, dangerous extension blocklist, double extension check |
| Tampered API responses | Low | HTTPS in production (Vercel enforces TLS), response integrity via structured JSON |

### R — Repudiation

| Threat | Risk | Mitigation |
|--------|------|------------|
| Citizen denies submitting request | Low | `timeline_events` table logs every status change with timestamps, request IDs are unique |
| Admin denies approving/rejecting | Medium | Timeline events log admin actions with timestamps |

### I — Information Disclosure

| Threat | Risk | Mitigation |
|--------|------|------------|
| Aadhaar data leaked from sessionStorage | Medium | Auto-cleared on logout and inactivity timeout, session-scoped (not localStorage) |
| Physical device compromise (Pi board) | **High** | Planned: ML-KEM quantum-safe encryption for data-in-transit; SQLite WAL mode; Kiosk CSS prevents text selection/copy |
| Error messages leak internal details | Low | Production error handler returns generic messages (`Internal server error`) |
| Mobile number exposure | Low | Masked display (`XX****XXXX`) in OTP flow |

### D — Denial of Service

| Threat | Risk | Mitigation |
|--------|------|------------|
| API flood from single IP | Medium | `express-rate-limit`: 100 req/15min global, 10 req/15min on auth endpoints |
| Large payload attacks | Low | `express.json({ limit: '10mb' })` body size limit |
| IndexedDB/localStorage exhaustion | Low | Offline queue stores only pending submissions, auto-cleaned after sync |

### E — Elevation of Privilege

| Threat | Risk | Mitigation |
|--------|------|------------|
| Guest accessing citizen-only routes | Medium | `CitizenRoute` wrapper shows login gate, server-side `verifyToken` rejects unauthenticated |
| Normal user accessing admin dashboard | High | `AdminRoute` wrapper + `requireAdmin` middleware checks JWT `isAdmin` claim |
| JWT manipulation (forged isAdmin) | High | JWT signed with server-side secret, `jsonwebtoken` verifies signature integrity |

---

## 3. Security Controls Summary

| Control | Implementation | File |
|---------|---------------|------|
| JWT Authentication | Bearer token on all protected routes | `server/middleware/authMiddleware.js` |
| Rate Limiting | express-rate-limit (global + auth) | `server/index.js` |
| Input Sanitization | XSS encoding + HTML stripping | `src/utils/security.js` |
| CSRF Protection | Cryptographic token per session | `src/utils/security.js` |
| Session Security | Expiry + browser fingerprint binding | `src/utils/security.js` |
| File Upload Validation | Type, size, extension checks | `src/utils/security.js` |
| CSP Headers | Strict content security policy | `src/utils/security.js` |
| Kiosk Hardening | No selection, no overscroll, touch-only | `src/index.css` |
| Auto-Logout | 5min inactivity with 30s warning | `src/App.jsx` |
| Route Protection | 3-tier: Public → Protected → Admin | `src/App.jsx` |
| Password Hashing | bcryptjs for admin passwords | `server/routes/auth.js` |
| Offline Security | Session-scoped storage, auto-cleanup | `src/utils/offline.js` |

---

## 4. Residual Risks & Planned Mitigations

| Risk | Current Status | Planned |
|------|---------------|---------|
| Data-in-transit beyond HTTPS | HTTPS via Vercel TLS | ML-KEM-768 quantum-safe payload encryption |
| Physical device tampering | Kiosk CSS hardening | Hardware tamper detection, encrypted SQLite at rest |
| Voice data interception | Web Speech API (local) | Sarvam AI server-side processing (no client-side audio retention) |
| SMS OTP interception | Standard SMS delivery | TOTP-based verification as alternative |
