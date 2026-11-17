'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { OPEN_LOGIN_EVENT } from '@/lib/loginModal';
import QuickAuthForm from './QuickAuthForm';

// The site-wide login popup. Anything can open it with openLogin() from lib/loginModal.js;
// the visitor logs in with mobile + OTP and stays on the same page.
export default function LoginModalHost() {
  const [req, setReq] = useState(null); // { mode, onSuccess, key }
  const closeRef = useRef(null);
  const close = useCallback(() => setReq(null), []);

  useEffect(() => {
    const onOpen = (e) => setReq({ mode: e.detail?.mode || 'login', onSuccess: e.detail?.onSuccess, key: Date.now() });
    window.addEventListener(OPEN_LOGIN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_LOGIN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!req) return undefined;
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [req, close]);

  if (!req) return null;

  function done(user) {
    const cb = req.onSuccess;
    close();
    cb?.(user);
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="w-full max-w-sm bg-white rounded-2xl shadow-dropdown p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id="login-modal-title" className="font-bold font-heading text-lg text-gray-900">Welcome to PRObroker</h2>
            <p className="text-sm text-gray-500">Log in or sign up with your mobile number</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close"
            className="-mr-2 -mt-2 w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <QuickAuthForm key={req.key} initialMode={req.mode} onSuccess={done} />
      </div>
    </div>,
    document.body,
  );
}
