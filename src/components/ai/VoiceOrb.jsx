/**
 * VoiceOrb.jsx — Futuristic AI Voice Orb
 *
 * The visual centerpiece of the SUVIDHA AI. A glowing, animated orb that
 * morphs based on AI state (idle, listening, processing, speaking, executing).
 *
 * Inspired by: JARVIS, Gemini Live, ChatGPT Voice
 */

import React, { useEffect, useRef } from 'react';
import { useVoiceAssistant } from '../../ai/provider/VoiceAssistantProvider';

const STATE_STYLES = {
  idle: {
    outer: 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-indigo-400/30',
    inner: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    ring:  'border-indigo-400/40',
    glow:  'shadow-indigo-500/30',
    pulse: false,
    label: 'Say "Hey Suvidha"',
    labelColor: 'text-indigo-300',
  },
  listening: {
    outer: 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-400/50',
    inner: 'bg-gradient-to-br from-emerald-400 to-cyan-500',
    ring:  'border-emerald-400/60',
    glow:  'shadow-emerald-400/50',
    pulse: true,
    label: 'Listening…',
    labelColor: 'text-emerald-300',
  },
  processing: {
    outer: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400/50',
    inner: 'bg-gradient-to-br from-amber-400 to-orange-500',
    ring:  'border-amber-400/60',
    glow:  'shadow-amber-400/50',
    pulse: false,
    label: 'Thinking…',
    labelColor: 'text-amber-300',
  },
  speaking: {
    outer: 'bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border-blue-400/50',
    inner: 'bg-gradient-to-br from-blue-400 to-indigo-600',
    ring:  'border-blue-400/60',
    glow:  'shadow-blue-400/50',
    pulse: true,
    label: 'Speaking…',
    labelColor: 'text-blue-300',
  },
  executing: {
    outer: 'bg-gradient-to-br from-violet-500/20 to-purple-600/20 border-violet-400/50',
    inner: 'bg-gradient-to-br from-violet-400 to-purple-600',
    ring:  'border-violet-400/60',
    glow:  'shadow-violet-400/50',
    pulse: false,
    label: 'Executing…',
    labelColor: 'text-violet-300',
  },
  waiting: {
    outer: 'bg-gradient-to-br from-rose-500/20 to-pink-500/20 border-rose-400/50',
    inner: 'bg-gradient-to-br from-rose-400 to-pink-500',
    ring:  'border-rose-400/60',
    glow:  'shadow-rose-400/50',
    pulse: true,
    label: 'Confirm action?',
    labelColor: 'text-rose-300',
  },
};

export default function VoiceOrb({ size = 'md', onClick, className = '' }) {
  const { aiState, activate, deactivate, isActivated } = useVoiceAssistant();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);

  const style = STATE_STYLES[aiState] || STATE_STYLES.idle;

  const sizeMap = {
    sm:  { outer: 'w-16 h-16',  inner: 'w-10 h-10',  ring: 'w-20 h-20',  icon: 28 },
    md:  { outer: 'w-24 h-24',  inner: 'w-16 h-16',  ring: 'w-32 h-32',  icon: 36 },
    lg:  { outer: 'w-36 h-36',  inner: 'w-24 h-24',  ring: 'w-44 h-44',  icon: 52 },
  };
  const sz = sizeMap[size] || sizeMap.md;

  // Animated particle ring on canvas for listening state
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = W * 0.38;

    function draw() {
      frameRef.current += 1;
      ctx.clearRect(0, 0, W, H);

      if (aiState === 'listening' || aiState === 'speaking') {
        const t = frameRef.current * 0.05;
        const count = 40;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 + t;
          const wave = Math.sin(frameRef.current * 0.08 + i * 0.4) * (aiState === 'listening' ? 8 : 12);
          const r = R + wave;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          const alpha = 0.3 + 0.4 * Math.abs(Math.sin(frameRef.current * 0.06 + i * 0.3));

          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          const color = aiState === 'listening' ? `rgba(52,211,153,${alpha})` : `rgba(96,165,250,${alpha})`;
          ctx.fillStyle = color;
          ctx.fill();
        }
      } else if (aiState === 'processing') {
        const t = frameRef.current * 0.04;
        for (let i = 0; i < 3; i++) {
          const angle = t + (i / 3) * Math.PI * 2;
          const x = cx + Math.cos(angle) * R;
          const y = cy + Math.sin(angle) * R;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251,191,36,${0.6 + 0.4 * Math.sin(frameRef.current * 0.1)})`;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [aiState]);

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    if (isActivated) deactivate();
    else activate();
  };

  return (
    <div className={`relative flex flex-col items-center gap-3 ${className}`}>
      {/* Outer glow ring */}
      <div className="relative flex items-center justify-center">
        {/* Animated canvas layer */}
        <canvas
          ref={canvasRef}
          width={160}
          height={160}
          className="absolute pointer-events-none"
          style={{ width: 160, height: 160 }}
        />

        {/* Rotating ring */}
        <div
          className={`absolute ${sz.ring} rounded-full border-2 ${style.ring} ${
            (aiState === 'listening' || aiState === 'speaking') ? 'animate-spin-slow' : ''
          }`}
          style={{
            animation: (aiState === 'listening' || aiState === 'speaking')
              ? 'spin 4s linear infinite'
              : 'none',
          }}
        />

        {/* Main orb button */}
        <button
          onClick={handleClick}
          className={`
            relative ${sz.outer} rounded-full flex items-center justify-center
            border-2 ${style.outer} backdrop-blur-md cursor-pointer
            transition-all duration-500 ease-out
            shadow-2xl ${style.glow}
            hover:scale-105 active:scale-95
            ${style.pulse ? 'animate-pulse-orb' : ''}
          `}
          aria-label={`SUVIDHA AI — ${style.label}`}
          style={{
            boxShadow: `0 0 40px 8px ${
              aiState === 'listening' ? 'rgba(52,211,153,0.3)' :
              aiState === 'speaking'  ? 'rgba(96,165,250,0.3)' :
              aiState === 'processing'? 'rgba(251,191,36,0.3)' :
              'rgba(99,102,241,0.2)'
            }`,
          }}
        >
          {/* Inner orb */}
          <div
            className={`${sz.inner} rounded-full ${style.inner} flex items-center justify-center shadow-inner`}
            style={{
              transition: 'all 0.4s ease',
              animation: aiState === 'processing' ? 'spin 1.5s linear infinite' : 'none',
            }}
          >
            {/* Icon */}
            <OrbIcon state={aiState} size={sz.icon} />
          </div>
        </button>
      </div>

      {/* State label */}
      <div className={`text-xs font-semibold tracking-wider uppercase ${style.labelColor} transition-all duration-300`}>
        {style.label}
      </div>
    </div>
  );
}

function OrbIcon({ state, size }) {
  const s = size || 36;
  const color = 'white';

  if (state === 'listening') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    );
  }
  if (state === 'processing') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    );
  }
  if (state === 'speaking') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    );
  }
  if (state === 'executing') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    );
  }
  if (state === 'waiting') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    );
  }
  // idle — SUVIDHA star / sparkle
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
