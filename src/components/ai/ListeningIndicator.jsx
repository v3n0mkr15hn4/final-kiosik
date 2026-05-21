/**
 * ListeningIndicator.jsx — Compact "Hey Suvidha" status badge
 * Shows in the corner when wake word detection is active (idle mode).
 * Disappears during active conversation.
 */

import React from 'react';
import { useVoiceAssistant } from '../../ai/provider/VoiceAssistantProvider';

export default function ListeningIndicator() {
  const { aiState, isActivated } = useVoiceAssistant();

  // Only show when NOT in active conversation
  if (isActivated) return null;

  return (
    <div
      className="fixed bottom-6 right-28 z-40 flex items-center gap-2
                 bg-gray-900/80 backdrop-blur-sm text-white/80
                 px-3 py-1.5 rounded-full text-xs font-medium
                 border border-white/10 shadow-lg
                 transition-all duration-300"
      title="Say 'Hey Suvidha' to activate AI assistant"
      role="status"
      aria-label="Wake word detection active"
    >
      {/* Pulsing mic dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
      </span>
      <span className="hidden sm:inline">Hey Suvidha</span>
    </div>
  );
}
