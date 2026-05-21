/**
 * contextMemory.js — Conversation Context Memory
 *
 * Maintains the full conversation history and extracted context
 * across multiple turns so the AI can follow up naturally.
 *
 * Stored entirely in memory (sessionStorage for persistence across page navigations).
 */

const STORAGE_KEY = 'suvidha_ai_context';
const MAX_HISTORY = 20; // Keep last 20 turns to manage token count

// ── Internal state ────────────────────────────────────────────────────────

let _context = loadFromStorage();

function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return createFreshContext();
}

function createFreshContext() {
  return {
    sessionId: `session_${Date.now()}`,
    startedAt: new Date().toISOString(),
    language: 'en',
    detectedLanguage: null,
    citizenProfile: {
      aadhaar: null,
      name: null,
      phone: null,
      address: null,
      dob: null,
      gender: null,
      category: null, // SC/ST/OBC/General
    },
    currentIntent: null,
    currentService: null,   // e.g. 'electricity', 'gas'
    currentPage: '/',
    pendingForm: null,       // which form is being filled
    pendingFormFields: {},   // accumulated form data
    conversationHistory: [], // [{role, content, timestamp}]
    extractedEntities: {},   // named entities found across conversation
    lastAction: null,
    sessionFlags: {
      otpVerified: false,
      aadhaarVerified: false,
      isBlindMode: false,
      isElderlyMode: false,
    },
  };
}

function saveToStorage() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(_context));
  } catch { /* quota exceeded — clear old */ }
}

// ── Public API ────────────────────────────────────────────────────────────

/** Get the full context object. */
export function getContext() {
  return { ..._context };
}

/** Reset the entire context (new session / logout). */
export function resetContext() {
  _context = createFreshContext();
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Update specific context fields (shallow merge). */
export function updateContext(updates) {
  _context = { ..._context, ...updates };
  saveToStorage();
}

/** Update citizen profile fields. */
export function updateCitizenProfile(profileUpdates) {
  _context.citizenProfile = { ..._context.citizenProfile, ...profileUpdates };
  saveToStorage();
}

/** Update a pending form field value. */
export function updateFormField(fieldName, value) {
  _context.pendingFormFields = {
    ..._context.pendingFormFields,
    [fieldName]: value,
  };
  saveToStorage();
}

/** Set the current service being handled. */
export function setCurrentService(service) {
  _context.currentService = service;
  _context.currentIntent = null; // reset sub-intent when switching service
  saveToStorage();
}

/** Set which page the user is on. */
export function setCurrentPage(path) {
  _context.currentPage = path;
  saveToStorage();
}

/** Add a message to conversation history. */
export function addMessage(role, content, metadata = {}) {
  const message = {
    role, // 'user' | 'assistant' | 'system'
    content,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  _context.conversationHistory.push(message);

  // Trim to MAX_HISTORY (keep system messages, trim oldest user/assistant pairs)
  if (_context.conversationHistory.length > MAX_HISTORY) {
    const systemMessages = _context.conversationHistory.filter(m => m.role === 'system');
    const nonSystem = _context.conversationHistory.filter(m => m.role !== 'system');
    const trimmed = nonSystem.slice(-MAX_HISTORY);
    _context.conversationHistory = [...systemMessages, ...trimmed];
  }

  saveToStorage();
  return message;
}

/** Get conversation history in the format NVIDIA NIM expects. */
export function getMessagesForAPI() {
  return _context.conversationHistory
    .filter(m => m.role !== 'system') // system prompt added separately
    .map(m => ({ role: m.role, content: m.content }));
}

/** Extract and store entities from AI response. */
export function extractAndStoreEntities(aiResponse) {
  if (!aiResponse) return;

  // Extract from action if it's a form fill
  if (aiResponse.action?.type === 'FILL_FORM') {
    const { fieldName, value } = aiResponse.action;
    if (fieldName && value) {
      updateFormField(fieldName, value);

      // Also update citizen profile for common fields
      const profileMap = {
        aadhaar: 'aadhaar',
        name: 'name',
        phone: 'phone',
        address: 'address',
      };
      if (profileMap[fieldName]) {
        updateCitizenProfile({ [profileMap[fieldName]]: value });
      }
    }
  }

  // Update language from response
  if (aiResponse.language) {
    _context.language = aiResponse.language;
  }

  // Update current intent
  if (aiResponse.intent) {
    _context.currentIntent = aiResponse.intent;
  }

  // Update last action
  if (aiResponse.action) {
    _context.lastAction = aiResponse.action;
  }

  saveToStorage();
}

/** Get a short context summary string to inject into prompts. */
export function getContextSummary() {
  const c = _context;
  const parts = [];

  if (c.currentService) parts.push(`Current service: ${c.currentService}`);
  if (c.currentPage && c.currentPage !== '/') parts.push(`Current page: ${c.currentPage}`);
  if (c.pendingForm) parts.push(`Filling form: ${c.pendingForm}`);

  const filledFields = Object.keys(c.pendingFormFields);
  if (filledFields.length > 0) {
    parts.push(`Form data so far: ${filledFields.join(', ')}`);
  }

  const profile = c.citizenProfile;
  if (profile.name) parts.push(`Citizen name: ${profile.name}`);
  if (profile.aadhaar) parts.push(`Aadhaar: ${profile.aadhaar.replace(/\d(?=\d{4})/g, '*')}`);
  if (profile.phone) parts.push(`Phone: ${profile.phone}`);
  if (c.language && c.language !== 'en') parts.push(`User language: ${c.language}`);

  return parts.length > 0 ? `[Context: ${parts.join(' | ')}]` : '';
}

/** Check if we're in a multi-turn form-filling flow. */
export function isFormFillingActive() {
  return !!_context.pendingForm;
}

/** Start a form-filling flow. */
export function startFormFilling(formId) {
  _context.pendingForm = formId;
  _context.pendingFormFields = {};
  saveToStorage();
}

/** Complete/cancel the form-filling flow. */
export function endFormFilling() {
  const fields = { ..._context.pendingFormFields };
  _context.pendingForm = null;
  _context.pendingFormFields = {};
  saveToStorage();
  return fields; // return collected data
}

export default {
  getContext,
  resetContext,
  updateContext,
  updateCitizenProfile,
  updateFormField,
  setCurrentService,
  setCurrentPage,
  addMessage,
  getMessagesForAPI,
  extractAndStoreEntities,
  getContextSummary,
  isFormFillingActive,
  startFormFilling,
  endFormFilling,
};
