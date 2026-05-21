/**
 * conversationManager.js - Conversation Turn Manager
 */

import { callNvidiaAI } from '../api/nvidiaApi.js';
import { buildMessages } from './promptBuilder.js';
import {
  addMessage,
  extractAndStoreEntities,
  updateContext,
} from './contextMemory.js';
import { detectLanguage, setLanguagePreference } from './multilingualProcessor.js';

export async function processConversationTurn(userMessage, options = {}) {
  const { currentPath = '/', language: inputLang, onChunk } = options;

  if (!userMessage?.trim()) {
    return buildErrorResponse('Empty message received.');
  }

  const langInfo = detectLanguage(userMessage);
  const language = inputLang || langInfo.primary;
  setLanguagePreference(language);

  addMessage('user', userMessage, { language, detectedMixed: langInfo.isMixed });
  updateContext({ language, detectedLanguage: langInfo.primary });

  const messages = buildMessages(userMessage, {
    currentPath,
    language,
    includeKnowledge: true,
  });

  let aiResponse;
  try {
    // Always non-streaming: voice speaks after full reply; streaming prevents
    // response_format:json_object which causes JSON parse failures
    aiResponse = await callNvidiaAI(messages, {
      stream: false,
      jsonMode: true,
    });
    console.log('[ConversationManager] NVIDIA ok, intent:', aiResponse?.intent);
  } catch (err) {
    console.error('[ConversationManager] AI call failed:', err);
    aiResponse = buildOfflineResponse(language);
  }

  aiResponse = normaliseAIResponse(aiResponse, language);

  addMessage('assistant', aiResponse.response, {
    intent: aiResponse.intent,
    action: aiResponse.action,
    language: aiResponse.language,
  });

  extractAndStoreEntities(aiResponse);
  return aiResponse;
}

function normaliseAIResponse(raw, fallbackLanguage = 'en') {
  if (!raw || typeof raw !== 'object') {
    return buildErrorResponse('Invalid AI response format.', fallbackLanguage);
  }

  return {
    intent: raw.intent || 'general_response',
    response: raw.response || 'I am here to help. How can I assist you?',
    language: raw.language || fallbackLanguage,
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.7,
    action: raw.action || null,
    followUp: raw.followUp || null,
    suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
    offline: raw.offline || false,
  };
}

function buildErrorResponse(reason = '', language = 'en') {
  const text = 'I am having trouble processing your request. Please try again or use the navigation menu.';
  return {
    intent: 'error',
    response: text,
    language,
    confidence: 0,
    action: null,
    followUp: null,
    suggestions: [],
    error: reason,
  };
}

function buildOfflineResponse(language = 'en') {
  return {
    intent: 'service_degraded',
    response: 'AI response generation is temporarily unavailable. Please try again or use the navigation menu.',
    language,
    confidence: 1,
    action: null,
    followUp: null,
    suggestions: [],
    offline: false,
  };
}

export function generateGreeting(language = 'en', currentPath = '/') {
  return "Hello! I'm SUVIDHA, your AI assistant for government services. How can I help you today?";
}

export default {
  processConversationTurn,
  generateGreeting,
};
