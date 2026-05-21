/**
 * promptBuilder.js — Dynamic Prompt Builder
 *
 * Assembles the full messages array sent to NVIDIA NIM on each turn.
 * Combines:
 *  1. System prompt (SUVIDHA identity + rules)
 *  2. Knowledge context (current page + relevant service info)
 *  3. Conversation history (from contextMemory)
 *  4. User's latest message (with context summary prepended)
 */

import { SYSTEM_PROMPT } from '../prompts/systemPrompt.js';
import { buildKnowledgeSummary } from '../prompts/serviceKnowledge.js';
import { getMessagesForAPI, getContextSummary } from './contextMemory.js';

// ── Knowledge injection ───────────────────────────────────────────────────

const FULL_KNOWLEDGE = buildKnowledgeSummary();

/**
 * Get page-relevant knowledge to keep context focused and token-efficient.
 */
function getRelevantKnowledge(currentPath) {
  const pathToCategory = {
    '/electricity': 'electricity',
    '/electricity-menu': 'electricity',
    '/gas': 'gas',
    '/gas-menu': 'gas',
    '/water': 'water',
    '/sanitation': 'municipal',
    '/municipal': 'municipal',
    '/municipal-menu': 'municipal',
    '/transport': 'transport',
    '/healthcare': 'healthcare',
    '/schemes': 'schemes',
    '/complaints': 'municipal',
    '/track-status': null,
    '/office-locator': 'aadhaar',
  };

  const category = pathToCategory[currentPath];
  if (!category) return FULL_KNOWLEDGE;

  // Include the current category + general knowledge
  const relatedCats = [category, 'schemes', 'revenue'];
  return buildKnowledgeSummary([...new Set(relatedCats)]);
}

// ── Main builder ─────────────────────────────────────────────────────────

/**
 * Build the complete messages array for one AI turn.
 *
 * @param {string} userMessage   - what the user just said
 * @param {Object} options
 * @param {string} options.currentPath    - current route
 * @param {string} options.language       - detected language code
 * @param {boolean} options.includeKnowledge - inject service knowledge
 * @returns {Array<{role: string, content: string}>}
 */
export function buildMessages(userMessage, options = {}) {
  const {
    currentPath = '/',
    language = 'en',
    includeKnowledge = true,
  } = options;

  const contextSummary = getContextSummary();
  const history = getMessagesForAPI();

  // Build the system message — includes identity + knowledge
  let systemContent = SYSTEM_PROMPT;

  if (includeKnowledge) {
    const knowledge = getRelevantKnowledge(currentPath);
    systemContent += `\n\n## CURRENT KNOWLEDGE BASE\n${knowledge}`;
  }

  if (currentPath) {
    systemContent += `\n\n## CURRENT KIOSK STATE\nUser is on page: ${currentPath}`;
  }

  systemContent += `\n\nREMEMBER: Always respond in valid JSON only. User's language: ${language}.`;

  const messages = [
    { role: 'system', content: systemContent },
    ...history,
  ];

  // Add context summary to user message if there's context
  const enrichedUserMessage = contextSummary
    ? `${contextSummary}\n\nUser says: ${userMessage}`
    : userMessage;

  messages.push({ role: 'user', content: enrichedUserMessage });

  return messages;
}

/**
 * Build a minimal messages array for quick intents (no knowledge injection).
 * Used for fast interactions like language detection, simple navigation.
 */
export function buildLiteMessages(userMessage, language = 'en') {
  return [
    {
      role: 'system',
      content: `You are SUVIDHA, a government kiosk AI. Respond in JSON: { "intent": "...", "response": "...", "language": "${language}", "action": null }. User language: ${language}.`,
    },
    { role: 'user', content: userMessage },
  ];
}

/**
 * Build a form-extraction prompt to pull field values from natural speech.
 */
export function buildFormExtractionPrompt(userMessage, formFields, language = 'en') {
  const fieldList = formFields.join(', ');
  return [
    {
      role: 'system',
      content: `Extract form field values from the user's speech. Fields needed: ${fieldList}. Respond in JSON: { "extracted": { "fieldName": "value" }, "missing": ["fieldName"], "response": "confirmation in ${language}", "language": "${language}" }`,
    },
    { role: 'user', content: userMessage },
  ];
}

export default { buildMessages, buildLiteMessages, buildFormExtractionPrompt };
