/**
 * aiEngine.js — Main AI Engine
 *
 * The top-level orchestrator for SUVIDHA's conversational AI.
 * Coordinates: STT → NLP → LLM → Action → TTS
 *
 * This is what VoiceAssistantProvider calls.
 */

import { processConversationTurn, generateGreeting } from './conversationManager.js';
import { resetContext } from './contextMemory.js';
import { getCurrentLanguage } from './multilingualProcessor.js';

// ── AI Engine state ───────────────────────────────────────────────────────

let _isProcessing = false;
let _currentAbortController = null;

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Process a user utterance through the full AI pipeline.
 *
 * @param {string} userMessage       - transcribed speech or typed text
 * @param {Object} context
 * @param {string} context.currentPath    - current page path
 * @param {string} context.language       - language code
 * @param {Function} context.onChunk      - streaming response callback
 * @param {Function} context.onStateChange - state change: 'processing'|'done'|'error'
 * @returns {Promise<Object>}         - structured AI response
 */
export async function processUtterance(userMessage, context = {}) {
  // Cancel any in-flight request
  if (_currentAbortController) {
    _currentAbortController.abort();
  }
  _currentAbortController = new AbortController();

  if (_isProcessing) {
    console.warn('[AIEngine] Already processing — cancelling previous turn');
  }

  _isProcessing = true;
  context.onStateChange?.('processing');

  try {
    const response = await processConversationTurn(userMessage, {
      currentPath: context.currentPath || '/',
      language: context.language || getCurrentLanguage(),
      onChunk: context.onChunk,
    });

    _isProcessing = false;
    context.onStateChange?.('done');
    return response;

  } catch (err) {
    _isProcessing = false;
    context.onStateChange?.('error');
    console.error('[AIEngine] Error:', err);
    return {
      intent: 'error',
      response: 'I encountered an error. Please try again.',
      language: context.language || 'en',
      action: null,
      error: err.message,
    };
  }
}

/**
 * Get a greeting for session start.
 */
export function getGreeting(language = 'en', currentPath = '/') {
  return generateGreeting(language, currentPath);
}

/**
 * Reset the AI session (on logout / new citizen).
 */
export function resetSession() {
  resetContext();
  _isProcessing = false;
  if (_currentAbortController) {
    _currentAbortController.abort();
    _currentAbortController = null;
  }
}

/**
 * Check if AI is currently processing.
 */
export function isProcessing() {
  return _isProcessing;
}

export default {
  processUtterance,
  getGreeting,
  resetSession,
  isProcessing,
};
