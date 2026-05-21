/**
 * WaveformVisualizer.jsx — Animated audio waveform bars
 * Displays live audio energy as a bank of animated bars.
 * Pure CSS animation in idle/speaking states; JS-driven in listening.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useVoiceAssistant } from '../../ai/provider/VoiceAssistantProvider';

const BAR_COUNT = 20;

function getBarColor(state) {
  if (state === 'listening')  return '#34d399'; // emerald
  if (state === 'speaking')   return '#60a5fa'; // blue
  if (state === 'processing') return '#fbbf24'; // amber
  return '#818cf8'; // indigo for idle/executing
}

export default function WaveformVisualizer({ className = '', height = 48 }) {
  const { aiState } = useVoiceAssistant();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const frameRef = useRef(0);

  const isActive = aiState === 'listening' || aiState === 'speaking' || aiState === 'processing';
  const color = getBarColor(aiState);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const barW = W / BAR_COUNT;
    frameRef.current += 1;
    const t = frameRef.current;

    for (let i = 0; i < BAR_COUNT; i++) {
      let h;
      if (aiState === 'listening') {
        h = (Math.sin(t * 0.15 + i * 0.6) * 0.4 + 0.5) * H * 0.85 + 4;
        // Add some randomness
        h += Math.sin(t * 0.3 + i * 1.2) * H * 0.15;
      } else if (aiState === 'speaking') {
        h = (Math.sin(t * 0.12 + i * 0.5) * 0.3 + 0.45) * H * 0.9 + 4;
      } else if (aiState === 'processing') {
        // Sweeping wave
        const progress = ((t * 0.05 + i / BAR_COUNT) % 1);
        h = Math.sin(progress * Math.PI) * H * 0.8 + 4;
      } else {
        // Idle: tiny breathing bars
        h = (Math.sin(t * 0.03 + i * 0.8) * 0.1 + 0.15) * H + 2;
      }

      const x = i * barW + barW * 0.1;
      const w = barW * 0.8;
      const y = (H - h) / 2;

      // Gradient fill
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, color + 'ff');
      grad.addColorStop(1, color + '44');
      ctx.fillStyle = grad;

      const radius = Math.min(w / 2, 4);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [aiState, color]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={BAR_COUNT * 14}
      height={height}
      className={`transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-40'} ${className}`}
      style={{ width: '100%', maxWidth: BAR_COUNT * 14, height }}
      aria-hidden="true"
    />
  );
}
