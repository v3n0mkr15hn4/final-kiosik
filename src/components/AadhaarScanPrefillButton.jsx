import React, { useEffect } from 'react';
import { ScanLine, X } from 'lucide-react';
import { useAadhaarScanPrefill } from '../hooks/useAadhaarScanPrefill';
import { speak } from '../utils/ttsService';

/**
 * Drop-in "Fill from Aadhaar Card" button for service forms.
 *
 * When clicked, shows a fullscreen overlay and polls the local kiosk backend
 * for a result from scanner_service.py. When pyaadhaar data arrives, calls
 * onFields(fields) so the parent form can merge the data into its state.
 *
 * Props:
 *   onFields(fields) — called once with { name, gender, dob, address,
 *                       pincode, state, district } when scan succeeds.
 */
export default function AadhaarScanPrefillButton({ onFields }) {
  const { scanning, start, stop, fields } = useAadhaarScanPrefill();

  useEffect(() => {
    if (!fields) return;
    onFields(fields);
    speak('Aadhaar details filled. Please verify and continue.', { staticKey: 'aadhaar_form_filled' });
  }, [fields, onFields]);

  if (!scanning) {
    return (
      <button type="button" onClick={start} style={s.btn}>
        <ScanLine size={20} />
        Fill from Aadhaar Card
      </button>
    );
  }

  return (
    <div
      style={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Waiting for Aadhaar card scan"
    >
      <div style={s.box}>
        <div style={s.iconRing}>
          <ScanLine size={40} color="#2563eb" />
        </div>
        <p style={s.heading}>Place Aadhaar card in front of kiosk camera</p>
        <p style={s.sub}>Scanner will detect and fill your details automatically</p>
        <div style={s.dots}>
          <span style={{ ...s.dot, animationDelay: '0s' }} />
          <span style={{ ...s.dot, animationDelay: '0.2s' }} />
          <span style={{ ...s.dot, animationDelay: '0.4s' }} />
        </div>
        <button type="button" onClick={stop} style={s.cancelBtn}>
          <X size={16} /> Cancel
        </button>
      </div>

      <style>{`
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const s = {
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
    border: '1.5px solid #93c5fd',
    borderRadius: 16,
    padding: '14px 24px',
    color: '#1e3a8a',
    fontWeight: 700,
    fontSize: 18,
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(37,99,235,0.1)',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(15,23,42,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  box: {
    background: 'white',
    borderRadius: 32,
    padding: '56px 64px',
    textAlign: 'center',
    maxWidth: 600,
    width: '90%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: '50%',
    background: '#dbeafe',
    border: '4px solid #3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: 800,
    color: '#1e3a8a',
    margin: 0,
    lineHeight: 1.3,
  },
  sub: {
    fontSize: 18,
    color: '#64748b',
    margin: 0,
  },
  dots: {
    display: 'flex',
    gap: 10,
    marginTop: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: '#3b82f6',
    display: 'inline-block',
    animation: 'dot-bounce 1.4s ease-in-out infinite',
  },
  cancelBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    padding: '10px 20px',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: 16,
    marginTop: 8,
  },
};
