'use client';

import { useEffect, useRef } from 'react';

// One box per digit. Typing advances, Backspace steps back, and pasting or SMS autofill
// (iOS drops the whole code into the first box) fills every box at once.
export default function OtpInput({ value, onChange, length = 4, disabled, invalid, autoFocus }) {
  const refs = useRef([]);
  // Focus moves before React re-renders, so the focus guard must read the newest value.
  const latest = useRef(value);
  latest.current = value;
  const commit = (next) => {
    latest.current = next;
    onChange(next);
  };
  const focusAt = (i) => refs.current[Math.max(0, Math.min(i, length - 1))]?.focus();

  useEffect(() => {
    if (autoFocus) focusAt(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  function fill(code) {
    const next = code.replace(/\D/g, '').slice(0, length);
    commit(next);
    focusAt(next.length);
  }

  function handleChange(i, raw) {
    const typed = raw.replace(/\D/g, '');
    if (typed.length >= length) return fill(typed);
    const digit = typed.slice(-1);
    if (!digit) return;
    commit((value.slice(0, i) + digit + value.slice(i + 1)).slice(0, length));
    focusAt(i + 1);
  }

  function handleKeyDown(i, e) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const at = value[i] ? i : i - 1;
      if (at < 0) return;
      commit(value.slice(0, at) + value.slice(at + 1));
      focusAt(at);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(Math.min(i + 1, value.length));
    }
  }

  return (
    <div className="flex gap-3" role="group" aria-label={`${length}-digit verification code`}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${i + 1}`}
          value={value[i] || ''}
          disabled={disabled}
          onFocus={(e) => {
            // Don't let the cursor land past the first empty box.
            if (i > latest.current.length) focusAt(latest.current.length);
            else e.target.select();
          }}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => {
            e.preventDefault();
            fill(e.clipboardData.getData('text'));
          }}
          className={`w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-xl border bg-white text-center text-2xl font-bold font-heading text-gray-900 outline-none transition-all disabled:bg-gray-50 ${
            invalid
              ? 'border-red-400 focus:ring-4 focus:ring-red-100'
              : value[i]
                ? 'border-primary/60 focus:border-primary focus:ring-4 focus:ring-primary/10'
                : 'border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10'
          }`}
        />
      ))}
    </div>
  );
}
