# SUVIDHA 2026 Enterprise Implementation Guide

## 1) Backend Folder Structure
```txt
server/
  index.js
  db.js
  .env.example
  Dockerfile
  enterprise/
    schema.js
    config/
      constants.js
    services/
      adminAuthService.js
      auditService.js
      requestContext.js
      routingService.js
      tokenService.js
  middleware/
    authMiddleware.js
    enterprise/
      authz.js
      auditLogger.js
      csrfProtection.js
      observability.js
      uploadValidation.js
  routes/
    auth.js
    otp.js
    services.js
    complaints.js
    admin.js
    adminAuth.js
    adminPortal.js
  sql/
    mysql_enterprise_schema.sql
```

## 2) Frontend Folder Structure
```txt
src/
  App.jsx
  context/
    AuthContext.jsx
  utils/
    apiService.js
  pages/
    Landing.jsx
    Home.jsx
    admin/
      AdminLogin.jsx
      AdminLayout.jsx
      SuperAdminDashboard.jsx
      KioskOpsDashboard.jsx
      DepartmentDashboard.jsx
      OfficerWorkspace.jsx
      SecurityDashboard.jsx
      AuditDashboard.jsx
```

## 3) Production MySQL Schema
- Implemented in [mysql_enterprise_schema.sql](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/sql/mysql_enterprise_schema.sql)
- Includes all requested domains: users, roles, permissions, departments, organizations, queues, service routing, applications, documents, assignments, workflow history, notifications, audit logs, incidents, SLA, escalations, admin auth tables.

## 4) RBAC Architecture
- Role codes: `SUPER_ADMIN`, `KIOSK_ADMIN`, `DEPARTMENT_HEAD`, `DEPARTMENT_OFFICER`, `FIELD_OFFICER`, `AUDITOR`, `SECURITY_ANALYST`, `SUPPORT_STAFF`
- Permission checks: `requirePermission(permissionCode)` middleware.
- Role checks: `requireRole([...])` middleware.
- Department isolation: `requireDepartmentOwnership(resolveDepartmentId)` middleware.

## 5) Middleware Code
- `verifyJWT`, `verifyRefreshToken`, `requireRole`, `requirePermission`, `requireDepartmentOwnership`, `rateLimiter`: [authz.js](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/middleware/enterprise/authz.js)
- `securityHeaders`, `requestLogger`: [observability.js](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/middleware/enterprise/observability.js)
- `auditLogger`: [auditLogger.js](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/middleware/enterprise/auditLogger.js)
- `csrfProtection`: [csrfProtection.js](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/middleware/enterprise/csrfProtection.js)
- `uploadValidation`: [uploadValidation.js](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/middleware/enterprise/uploadValidation.js)

## 6) Express API Architecture
- Citizen auth and citizen routes remain under `/api/auth`, `/api/otp`, `/api/service-requests`, `/api/complaints`
- New admin auth split under `/api/admin-auth` (login, MFA verify, refresh, logout, me)
- New enterprise admin operations under `/api/admin-portal`

## 7) React Architecture
- Separate admin login route `/admin-login`
- Separate admin dashboards under `/admin/*`
- Citizen flow remains `/login` and service pages
- Auth context now supports both actor types with isolated session state

## 8) Socket.IO Architecture
- Socket.IO server initialized in [index.js](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/index.js)
- Room strategy:
  - `department:{departmentId}`
  - `role:{roleCode}`
  - `kiosk:{kioskId}`
- Events emitted:
  - `application:routed`
  - `application:assigned`
  - `workflow:updated`
  - `kiosk:heartbeat`

## 9) Security Architecture
- Helmet, strict CORS, rate limiting, input sanitization
- Admin: password hash + MFA + refresh token rotation + device fingerprint + login logs
- CSRF protection for mutating admin portal routes
- Security incident capture for anomalies and token misuse

## 10) Kiosk Monitoring Architecture
- Kiosk master table: `kiosks`
- Telemetry table: `kiosk_health_logs`
- Device health table: `device_status` (MySQL schema)
- API: `/api/admin-portal/kiosk/health` and `/api/admin-portal/kiosk/:kioskId/heartbeat`

## 11) Workflow Engine Design
- States: `Submitted`, `Assigned`, `Under Review`, `Verification Pending`, `Documents Requested`, `Approved`, `Rejected`, `Escalated`, `Completed`
- Transition history persisted in `workflow_history`
- Workflow update endpoint: `/api/admin-portal/applications/:applicationId/workflow`

## 12) Department Routing Architecture
- Mapping table: `service_department_mapping`
- Routing engine implementation: [routingService.js](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/enterprise/services/routingService.js)
- Triggered automatically during service submission in [services.js](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/routes/services.js)

## 13) Audit Logging Architecture
- Append-only writes through [auditService.js](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/enterprise/services/auditService.js)
- Middleware wrapper for endpoint-level event logging: `auditLogger`
- Retrieval endpoint: `/api/admin-portal/audit/logs`

## 14) Docker Setup
- Frontend image: [Dockerfile](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/Dockerfile)
- Backend image: [server/Dockerfile](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/Dockerfile)
- Full stack compose: [docker-compose.enterprise.yml](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/docker-compose.enterprise.yml)

## 15) Deployment Architecture
- Edge: CDN + WAF
- App tier: stateless frontend + backend containers
- Data tier: MySQL + Redis + object storage for encrypted docs
- Observability: SIEM ingestion of audit/security events

## 16) Scalability Strategy
- Horizontal backend scaling behind load balancer
- Queue-based async tasks for notifications/malware/OCR
- Redis for rate-limit/session/cache
- Database indexes for department + status filtering

## 17) Queue Architecture
- Logical queues via `queues` table
- Assignment table links `application` -> `queue` and assignee
- Supports priority and escalation metadata

## 18) Secure Upload Architecture
- Existing upload API + MIME checks + size checks
- Recommended production extension from schema:
  - encrypted object storage
  - malware scan state on `application_documents.malware_status`
  - signed URL access with short TTL

## 19) Offline Sync Architecture
- Existing citizen offline sync API `/api/sync`
- Recommended production evolution:
  - local encrypted queue at kiosk
  - retry with exponential backoff
  - conflict checks by `request_id` + `updated_at`

## 20) Critical Module Samples
- Admin auth service: [adminAuthService.js](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/enterprise/services/adminAuthService.js)
- Routing service: [routingService.js](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/enterprise/services/routingService.js)
- Admin portal API: [adminPortal.js](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/server/routes/adminPortal.js)
- React admin login: [AdminLogin.jsx](/c:/Users/sures/Downloads/kiosk-hackathon-2026-feature-upload-secure-flow/kiosk-hackathon-2026-feature-upload-secure-flow/src/pages/admin/AdminLogin.jsx)

## Admin Flow (Implemented)
1. Admin opens `/admin-login`
2. Enter employee ID or official email + password
3. Server validates credentials and issues MFA challenge
4. Admin enters MFA code
5. Server issues access + refresh tokens and role payload
6. UI auto-redirects to dashboard mapped by role
7. No organization selection page is shown to admin users

## Demo Admin Credentials
- Password for seeded admin users: `Admin@2026!`
- Employee IDs:
  - `EMP-SUPER-001`
  - `EMP-KIOSK-001`
  - `EMP-ELEC-HEAD-001`
  - `EMP-SOC-001`
- In development mode, MFA response includes `devMfaCode` for testing.
