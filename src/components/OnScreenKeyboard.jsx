// ──────────────────────────────────────────────────────────────────
// On-screen virtual keyboard — global, touch-triggered.
//
// Auto-appears whenever the user focuses (touches) any editable text
// input or textarea, anywhere in the app, and types into that field.
//
// Why the native-setter dance: app inputs are CONTROLLED React fields
// (value/onChange — see Input.jsx, TextArea.jsx). Assigning el.value
// won't update React state. We must call the native value setter and
// dispatch a bubbling `input` event so React's onChange fires.
//
// Why preventDefault on pointerdown: tapping a key would otherwise blur
// the focused field (and drop the caret). preventDefault keeps focus on
// the input so insertion lands at the right place.
//
// Mounted once globally in App's AIShell — inert until a field is focused.
// ──────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
import './OnScreenKeyboard.css';

// Layout rows. Letters render upper/lower per the Shift toggle.
const ROW_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const ROW_TOP = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const ROW_MID = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const ROW_BOT = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

// <input> types that accept free text (so the keyboard should show).
const TEXT_INPUT_TYPES = new Set([
  'text', 'search', 'email', 'url', 'tel', 'password', 'number', '',
]);

function isEditableTextField(el) {
  if (!el || el.disabled || el.readOnly) return false;
  if (el.hasAttribute && el.hasAttribute('data-no-osk')) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) {
    return TEXT_INPUT_TYPES.has((el.getAttribute('type') || '').toLowerCase());
  }
  return false;
}

// Set value on a controlled input/textarea so React picks up the change.
function setNativeValue(el, value) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

// Replace the current selection (or insert at caret) with `text`.
// `back` > 0 deletes that many chars before the caret when no selection.
function editField(el, text, back = 0) {
  const value = el.value ?? '';
  let start = el.selectionStart;
  let end = el.selectionEnd;

  // type=number / email don't support selection range — fall back to end.
  if (start == null || end == null) {
    start = value.length;
    end = value.length;
  }

  if (start === end && back > 0) {
    start = Math.max(0, start - back);
  }

  const next = value.slice(0, start) + text + value.slice(end);
  const caret = start + text.length;

  setNativeValue(el, next);

  // Restore caret after React's re-render (controlled value matches `next`).
  try {
    el.setSelectionRange(caret, caret);
  } catch {
    /* unsupported (e.g. type=number) — caret defaults to end, acceptable */
  }
}

export default function OnScreenKeyboard() {
  const [visible, setVisible] = useState(false);
  const [shift, setShift] = useState(false);
  const activeElRef = useRef(null);
  const hideTimerRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    const clearHideTimer = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const onFocusIn = (e) => {
      const el = e.target;
      if (isEditableTextField(el)) {
        clearHideTimer();
        activeElRef.current = el;
        setVisible(true);
      }
    };

    const onFocusOut = (e) => {
      // Moving focus INTO the keyboard? keep it open.
      const next = e.relatedTarget;
      if (next && rootRef.current && rootRef.current.contains(next)) return;
      // Defer: a key tap may refocus the field on the next tick.
      clearHideTimer();
      hideTimerRef.current = setTimeout(() => {
        activeElRef.current = null;
        setVisible(false);
        setShift(false);
      }, 120);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      clearHideTimer();
    };
  }, []);

  const withField = useCallback((fn) => {
    const el = activeElRef.current;
    if (!el) return;
    if (document.activeElement !== el) el.focus();
    fn(el);
  }, []);

  const typeChar = useCallback(
    (ch) => withField((el) => {
      editField(el, ch);
      if (shift) setShift(false); // shift = one-shot, like a phone keyboard
    }),
    [withField, shift],
  );

  const onSpace = useCallback(() => withField((el) => editField(el, ' ')), [withField]);

  const onBackspace = useCallback(
    () => withField((el) => editField(el, '', 1)),
    [withField],
  );

  const onEnter = useCallback(
    () => withField((el) => {
      if (el instanceof HTMLTextAreaElement) {
        editField(el, '\n');
        return;
      }
      // Single-line input: let forms react to Enter, then hide.
      el.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true,
        }),
      );
      setVisible(false);
    }),
    [withField],
  );

  const hide = useCallback(() => {
    setVisible(false);
    setShift(false);
    activeElRef.current = null;
  }, []);

  if (!visible) return null;

  // Keep focus on the field — buttons must not steal it on press.
  const keepFocus = (e) => e.preventDefault();

  const letter = (ch) => (shift ? ch.toUpperCase() : ch);

  const LetterKey = ({ ch }) => (
    <button
      type="button"
      className="osk-key"
      onPointerDown={keepFocus}
      onMouseDown={keepFocus}
      onClick={() => typeChar(letter(ch))}
      aria-label={letter(ch)}
    >
      {letter(ch)}
    </button>
  );

  return (
    <div className="osk" ref={rootRef} role="group" aria-label="On-screen keyboard">
      <div className="osk-row">
        {ROW_DIGITS.map((d) => (
          <button
            key={d}
            type="button"
            className="osk-key"
            onPointerDown={keepFocus}
            onMouseDown={keepFocus}
            onClick={() => typeChar(d)}
            aria-label={d}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="osk-row">
        {ROW_TOP.map((c) => <LetterKey key={c} ch={c} />)}
      </div>

      <div className="osk-row">
        {ROW_MID.map((c) => <LetterKey key={c} ch={c} />)}
      </div>

      <div className="osk-row">
        <button
          type="button"
          className={`osk-key osk-key--func osk-key--shift osk-key--wide${shift ? ' is-active' : ''}`}
          onPointerDown={keepFocus}
          onMouseDown={keepFocus}
          onClick={() => setShift((s) => !s)}
          aria-label="Shift"
          aria-pressed={shift}
        >
          ⇧
        </button>
        {ROW_BOT.map((c) => <LetterKey key={c} ch={c} />)}
        <button
          type="button"
          className="osk-key osk-key--func osk-key--backspace osk-key--wide"
          onPointerDown={keepFocus}
          onMouseDown={keepFocus}
          onClick={onBackspace}
          aria-label="Backspace"
        >
          ⌫
        </button>
      </div>

      <div className="osk-row">
        <button
          type="button"
          className="osk-key osk-key--func osk-key--hide"
          onPointerDown={keepFocus}
          onMouseDown={keepFocus}
          onClick={hide}
          aria-label="Hide keyboard"
        >
          ⌄
        </button>
        <button
          type="button"
          className="osk-key osk-key--space"
          onPointerDown={keepFocus}
          onMouseDown={keepFocus}
          onClick={onSpace}
          aria-label="Space"
        >
          space
        </button>
        <button
          type="button"
          className="osk-key osk-key--func osk-key--enter osk-key--wide"
          onPointerDown={keepFocus}
          onMouseDown={keepFocus}
          onClick={onEnter}
          aria-label="Enter"
        >
          ⏎
        </button>
      </div>
    </div>
  );
}
