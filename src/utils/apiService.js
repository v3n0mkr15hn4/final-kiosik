/**
 * API Service â€” Real HTTP calls to the backend server.
 * Replaces the mock setTimeout-based calls throughout the app.
 * Falls back to mock behavior if the backend is unreachable (offline mode).
 */

import axios from 'axios';
import { csrf } from './security';

// API base URL â€” uses Vite proxy in dev, relative path in production
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const getDeviceFingerprint = () => {
  let fingerprint = localStorage.getItem('device-fingerprint');
  if (!fingerprint) {
    const seed = `${navigator.userAgent}|${navigator.language}|${screen.width}x${screen.height}|${navigator.hardwareConcurrency || 'na'}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    fingerprint = `web-${Math.abs(hash).toString(36)}`;
    localStorage.setItem('device-fingerprint', fingerprint);
  }
  return fingerprint;
};

// Export the raw axios instance for use by sarvamAPI and other direct callers
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Public API instance (no auth headers)
export const publicApi = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

publicApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      return Promise.reject(error.response.data);
    }
    if (error.code === 'ECONNABORTED' || !navigator.onLine) {
      return Promise.reject({ success: false, error: 'Network error. You may be offline.' });
    }
    return Promise.reject({ success: false, error: error.message });
  }
);

publicApi.interceptors.request.use((config) => {
  config.headers['X-Device-Fingerprint'] = getDeviceFingerprint();
  return config;
});

// Attach CSRF token and JWT auth token to every request
api.interceptors.request.use((config) => {
  const csrfToken = csrf.getToken();
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  // Attach JWT token for protected routes
  const authToken = sessionStorage.getItem('authToken');
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  config.headers['X-Device-Fingerprint'] = getDeviceFingerprint();
  return config;
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      return Promise.reject(error.response.data);
    }
    if (error.code === 'ECONNABORTED' || !navigator.onLine) {
      return Promise.reject({ success: false, error: 'Network error. You may be offline.' });
    }
    return Promise.reject({ success: false, error: error.message });
  }
);

// â”€â”€â”€ Authentication â”€â”€â”€
export const authAPI = {
  lookupAadhaar: (uid) => api.post('/auth/aadhaar/lookup', { uid }),
  verifyQR: (uid) => api.post('/auth/aadhaar/verify-qr', { uid }),
  verifyBiometric: (uid, method) => api.post('/auth/aadhaar/verify-biometric', { uid, method }),
  validateAadhaarMobile: (uid, mobile) => api.post('/auth/aadhaar/validate-mobile', { uid, mobile }),
};

export const adminAuthAPI = {
  login: ({ identifier, password }) => publicApi.post('/admin-auth/login', { identifier, password }),
  verifyMfa: ({ mfaTokenId, challengeId, mfaCode }) => publicApi.post('/admin-auth/verify-mfa', {
    challengeId: challengeId || mfaTokenId,
    mfaCode,
  }),
  refresh: ({ refreshToken }) => publicApi.post('/admin-auth/refresh', { refreshToken }),
  logout: ({ refreshToken }) => api.post('/admin-auth/logout', { refreshToken }),
  me: () => api.get('/admin-auth/me'),
};

export const otpAPI = {
  sendOtp: ({ uid, mobile }) => api.post('/otp/send-otp', { uid, mobile }),
  verifyOtp: ({ uid, mobile, otp }) => api.post('/otp/verify-otp', { uid, mobile, otp }),
};

// â”€â”€â”€ Service Requests â”€â”€â”€
export const serviceAPI = {
  submit: (data) => api.post('/service-requests', data),
  get: (requestId) => api.get(`/service-requests/${requestId}`),
  list: (params) => api.get('/service-requests', { params }),
};

// â”€â”€â”€ Complaints â”€â”€â”€
export const complaintAPI = {
  submit: (data) => api.post('/complaints', data),
  get: (complaintId) => api.get(`/complaints/${complaintId}`),
};

// â”€â”€â”€ Transport â”€â”€â”€
export const transportAPI = {
  bookTicket: (data) => api.post('/transport/book-ticket', data),
  getTicket: (ticketId) => api.get(`/transport/tickets/${ticketId}`),
};

// â”€â”€â”€ Tracking â”€â”€â”€
export const trackAPI = {
  byRequestId: (requestId) => api.get('/track', { params: { requestId } }),
  byMobile: (mobile) => api.get('/track', { params: { mobile } }),
};

// â”€â”€â”€ Schemes â”€â”€â”€
export const schemeAPI = {
  discover: (profile) => api.post('/schemes/discover', profile),
  list: () => api.get('/schemes'),
};

// â”€â”€â”€ Offices â”€â”€â”€
export const officeAPI = {
  search: (params) => api.get('/offices', { params }),
  getNearby: (params) => api.get('/offices/nearby', { params }),
  getById: (officeId) => api.get(`/offices/${officeId}`),
  getByCategory: (type, params) => api.get(`/offices/category/${type}`, { params }),
  getOfficesByState: (state, params) => api.get(`/offices/state/${state}`, { params }),
  getOfficesByDistrict: (district, params) => api.get(`/offices/district/${district}`, { params }),
  getNearestOfficeSuggestions: (params) => api.get('/offices/nearest', { params }),
  getRoutes: (params) => api.get('/offices/routes', { params }),
};

// â”€â”€â”€ Admin â”€â”€â”€
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getApplications: (params) => api.get('/admin/applications', { params }),
  getGrievanceStats: () => api.get('/admin/grievances/stats'),
  approveApplication: (id) => api.put(`/admin/applications/${id}/approve`),
  rejectApplication: (id, reason) => api.put(`/admin/applications/${id}/reject`, { reason }),
};

const readAdminProfile = () => {
  try {
    return JSON.parse(sessionStorage.getItem('adminProfile') || '{}');
  } catch {
    return {};
  }
};

const inferOrganizationId = () => readAdminProfile().organizationId;
const inferDepartmentId = () => readAdminProfile().departmentId;

export const kioskAdminAPI = {
  getDashboard: () => api.get('/kiosk-admin/dashboard'),
  getKioskHealth: () => api.get('/kiosk-admin/kiosks/health'),
  postHeartbeat: (kioskId, payload) => api.post(`/kiosk-admin/kiosks/${kioskId}/heartbeat`, payload),
  runDiagnostics: (kioskId) => api.post(`/kiosk-admin/kiosks/${kioskId}/diagnostics`),
  rebootKiosk: (kioskId) => api.post(`/kiosk-admin/kiosks/${kioskId}/reboot`),
  shutdownKiosk: (kioskId) => api.post(`/kiosk-admin/kiosks/${kioskId}/shutdown`),
  getSyncFailures: () => api.get('/kiosk-admin/sync/failures'),
  getSecurityAlerts: () => api.get('/kiosk-admin/security/alerts'),
};

export const organizationPortalAPI = {
  listOrganizations: () => api.get('/org-portals/organizations'),
  getSummary: (organizationId = inferOrganizationId()) => api.get(`/org-portals/${organizationId}/dashboard/summary`),
  getApplications: (organizationId = inferOrganizationId(), params) => api.get(`/org-portals/${organizationId}/applications`, { params }),
  getApplicationById: (applicationId, organizationId = inferOrganizationId()) => api.get(`/org-portals/${organizationId}/applications/${applicationId}`),
  routeApplication: (applicationId, organizationId = inferOrganizationId()) => api.post(`/org-portals/${organizationId}/applications/${applicationId}/route`),
  assignApplication: (applicationId, payload, organizationId = inferOrganizationId()) => api.post(`/org-portals/${organizationId}/applications/${applicationId}/assign`, payload),
  updateWorkflow: (applicationId, payload, organizationId = inferOrganizationId()) => api.post(`/org-portals/${organizationId}/applications/${applicationId}/workflow`, payload),
  getDocuments: (applicationId, organizationId = inferOrganizationId()) => api.get(`/org-portals/${organizationId}/applications/${applicationId}/documents`),
  runApplicationAction: (applicationId, payload, organizationId = inferOrganizationId()) => api.post(`/org-portals/${organizationId}/applications/${applicationId}/actions`, payload),
  addInternalNote: (applicationId, note, organizationId = inferOrganizationId()) => api.post(`/org-portals/${organizationId}/applications/${applicationId}/notes`, { note }),
  verifyDocument: (applicationId, documentId, organizationId = inferOrganizationId()) => api.post(`/org-portals/${organizationId}/applications/${applicationId}/documents/${documentId}/verify`),
  getDepartmentQueues: (
    departmentId = inferDepartmentId(),
    organizationId = inferOrganizationId(),
  ) => api.get(`/org-portals/${organizationId}/departments/${departmentId}/queues`),
  getDepartmentOfficers: (
    departmentId = inferDepartmentId(),
    organizationId = inferOrganizationId(),
  ) => api.get(`/org-portals/${organizationId}/departments/${departmentId}/officers`),
};

export const superAdminAPI = {
  getOverview: () => api.get('/super-admin/overview'),
  listOrganizations: () => api.get('/super-admin/organizations'),
  createOrganization: (payload) => api.post('/super-admin/organizations', payload),
  updateOrganizationStatus: (organizationId, status) => api.patch(`/super-admin/organizations/${organizationId}/status`, { status }),
  getRoles: () => api.get('/super-admin/rbac/roles'),
  getPermissions: () => api.get('/super-admin/rbac/permissions'),
  getKiosks: () => api.get('/super-admin/kiosks'),
  getKioskMaintenance: (kioskId) => api.get(`/super-admin/kiosks/${kioskId}/maintenance`),
};

export const securityCenterAPI = {
  getIncidents: () => api.get('/security-center/incidents'),
  createIncident: (payload) => api.post('/security-center/incidents', payload),
  updateIncident: (incidentId, status) => api.patch(`/security-center/incidents/${incidentId}`, { status }),
  getAuditLogs: () => api.get('/security-center/audit-logs'),
  getTamperingAlerts: () => api.get('/security-center/tampering-alerts'),
};

// Backward-compatible alias consumed by existing admin pages
export const adminPortalAPI = {
  getSummary: () => organizationPortalAPI.getSummary(),
  getApplications: (params) => organizationPortalAPI.getApplications(inferOrganizationId(), params),
  routeApplication: (applicationId) => organizationPortalAPI.routeApplication(applicationId),
  assignApplication: (applicationId, payload) => organizationPortalAPI.assignApplication(applicationId, payload),
  updateWorkflow: (applicationId, payload) => organizationPortalAPI.updateWorkflow(applicationId, payload),
  getKioskHealth: () => kioskAdminAPI.getKioskHealth(),
  kioskHeartbeat: (kioskId, payload) => kioskAdminAPI.postHeartbeat(kioskId, payload),
  getSecurityIncidents: () => securityCenterAPI.getIncidents(),
  getAuditLogs: () => securityCenterAPI.getAuditLogs(),
};

// â”€â”€â”€ Alerts â”€â”€â”€
export const alertAPI = {
  getEmergency: () => api.get('/alerts/emergency'),
  createAlert: (data) => api.post('/alerts/emergency', data),
};

// â”€â”€â”€ Upload â”€â”€â”€
export const uploadAPI = {
  createSession: (sessionId) => api.post('/upload', { sessionId }),
  getStatus: (sessionId) => api.get(`/upload/${sessionId}/status`),
  uploadFiles: (sessionId, formData) =>
    api.post(`/upload/${sessionId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const uploadPublicAPI = {
  verifyPin: (sessionId, pin) => publicApi.post(`/upload-public/${sessionId}/verify-pin`, { pin }),
  getStatus: (sessionId, pin) => publicApi.get(`/upload-public/${sessionId}/status`, { params: { pin } }),
  uploadFiles: (sessionId, formData) =>
    publicApi.post(`/upload-public/${sessionId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// â”€â”€â”€ Notifications â”€â”€â”€
export const notificationAPI = {
  sendReceipt: (data) => api.post('/notifications/send-receipt', data),
};

// â”€â”€â”€ Reference Data â”€â”€â”€
export const referenceAPI = {
  getStates: () => api.get('/reference/states'),
  getCities: (state) => api.get('/reference/cities', { params: { state } }),
  getWards: (city) => api.get('/reference/wards', { params: { city } }),
  getServiceCategories: (type) => api.get('/reference/service-categories', { params: { type } }),
  getComplaintTypes: () => api.get('/reference/complaint-types'),
};

// â”€â”€â”€ Sync â”€â”€â”€
export const syncAPI = {
  syncPending: (submissions) => api.post('/sync/pending', { submissions }),
};

// â”€â”€â”€ Health â”€â”€â”€
export const healthCheck = () => api.get('/health');

// Default export for backward compatibility
export default {
  authAPI,
  adminAuthAPI,
  otpAPI,
  serviceAPI,
  complaintAPI,
  transportAPI,
  trackAPI,
  schemeAPI,
  officeAPI,
  adminAPI,
  adminPortalAPI,
  kioskAdminAPI,
  organizationPortalAPI,
  superAdminAPI,
  securityCenterAPI,
  alertAPI,
  uploadAPI,
  uploadPublicAPI,
  notificationAPI,
  referenceAPI,
  syncAPI,
  healthCheck,
};

