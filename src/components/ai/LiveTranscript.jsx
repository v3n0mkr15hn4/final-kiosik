/**
 * LiveTranscript.jsx — Live voice transcript display
 * Shows what the user is saying (interim) and what was said (final)
 * alongside AI responses, as a flowing conversation UI.
 */

import React, { useRef, useEffect } from 'react';
import { useVoiceAssistant } from '../../ai/provider/VoiceAssistantProvider';

export default function LiveTranscript({ maxVisible = 6, className = '' }) {
  const { messages, interimTranscript, aiState } = useVoiceAssistant();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  const visible = messages.slice(-maxVisible);

  return (
    <div className={`flex flex-col gap-2 overflow-hidden ${className}`} role="log" aria-live="polite">
      {visible.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
        >
          <div
            className={`
              max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-white/20 text-white rounded-br-md backdrop-blur-sm border border-white/20'
                : 'bg-black/30 text-white/90 rounded-bl-md backdrop-blur-sm border border-white/10'}
            `}
          >
            {msg.role === 'assistant' && (
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-indigo-300 text-xs font-semibold tracking-wide uppercase">Suvidha</span>
              </div>
            )}
            <p className="m-0">{msg.text}</p>
            {/* Quick reply suggestions */}
            {msg.role === 'assistant' && msg.suggestions?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {msg.suggestions.map((s, i) => (
                  <SuggestionChip key={i} text={s} />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Live interim transcript */}
      {interimTranscript && aiState === 'listening' && (
        <div className="flex justify-end animate-fade-in">
          <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-white/10 border border-white/20 backdrop-blur-sm">
            <p className="text-white/60 text-sm italic">{interimTranscript}…</p>
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {aiState === 'processing' && (
        <div className="flex justify-start animate-fade-in">
          <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-black/30 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-1.5">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
              <span className="text-xs text-white/50 ml-1">thinking…</span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function SuggestionChip({ text }) {
  const { sendMessage } = useVoiceAssistant();
  return (
    <button
      onClick={() => sendMessage(text)}
      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white
                 rounded-full text-xs border border-white/20 transition-all duration-200
                 active:scale-95 cursor-pointer"
    >
      {text}
    </button>
  );
}
