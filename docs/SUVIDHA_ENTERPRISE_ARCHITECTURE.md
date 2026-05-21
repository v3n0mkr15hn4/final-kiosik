# SUVIDHA 2026 Enterprise Architecture

## Backend Structure

```txt
server/
  bootstrap/
    enterpriseBootstrap.js
  config/
    enterpriseRbac.js
  enterprise/
    schema.js
    config/constants.js
    services/{tokenService,adminAuthService,routingService,auditService,requestContext}.js
  middleware/
    authMiddleware.js
    enterprise/{authz,csrfProtection,auditLogger,observability,uploadValidation}.js
  routes/
    adminAuth.js
    adminPortal.js
    enterpriseApplications.js
    departmentOps.js
    kioskOps.js
    securityOps.js
    enterpriseAnalytics.js
    offlineSyncOps.js
    auth.js (citizen auth only)
    otp.js
    services.js
    complaints.js
    upload.js
    ...
  services/
    adminAuthService.js
    routingEngine.js
    auditService.js
  socket/
    realtime.js
  sql/
    mysql_enterprise_schema.sql
```

## Frontend Structure

```txt
src/
  context/AuthContext.jsx
  pages/
    Landing.jsx
    Login.jsx (citizen flow)
    admin/
      AdminLogin.jsx
      AdminLayout.jsx
      SuperAdminDashboard.jsx
      KioskOpsDashboard.jsx
      DepartmentDashboard.jsx
      OfficerWorkspace.jsx
      SecurityDashboard.jsx
      AuditDashboard.jsx
  utils/
    apiService.js
  App.jsx
```

## Security & RBAC

- Separate auth systems:
  - Citizen: `/api/auth/*` + `/api/otp/*`
  - Admin: `/api/admin-auth/*` with Employee ID/email + password + MFA
- Middleware implemented and wired:
  - `verifyJWT`
  - `verifyRefreshToken`
  - `requireRole`
  - `requirePermission`
  - `requireDepartmentOwnership`
  - `rateLimiter`
  - `securityHeaders`
  - `uploadValidation`
  - `auditLogger`
  - `requestLogger`
  - `csrfProtection`
- Department isolation enforced at API layer for assignments/workflow/queues.
- Admin Aadhaar login endpoint deprecated (`/api/auth/admin/login` returns 410).

## Routing/Workflow

- Auto-routing via service mapping (`service_department_mapping`) on submission.
- Workflow states supported:
  - Submitted, Assigned, Under Review, Verification Pending,
    Documents Requested, Approved, Rejected, Escalated, Completed.
- Assignment + workflow transitions persisted in:
  - `application_assignments`
  - `workflow_history`
  - `escalation_logs`
  - `SLA_tracking`

## Kiosk & SOC

- Kiosk APIs:
  - heartbeat, health summary, diagnostics, reboot, emergency shutdown
- SOC APIs:
  - incident create/list
  - immutable audit log read
- Realtime transport:
  - Socket.IO server (`server/socket/realtime.js`)
  - channels for kiosk heartbeat, workflow updates, security alerts

## Admin UX Flow

- Admin login path:
  - `/admin-login`
  - credential step -> MFA step
  - role-based redirect to dashboard path from backend
- No admin organization-selection screen.
- Admin session never enters citizen screens (`CitizenRoute` redirects admins).

## Deployment

- `server/sql/mysql_enterprise_schema.sql` for production MySQL 8 deployment.
- Containerization:
  - `Dockerfile` (frontend)
  - `server/Dockerfile` (backend)
  - `docker-compose.yml` (frontend + backend + mysql)

