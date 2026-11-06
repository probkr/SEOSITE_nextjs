'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ContactActions, { PhoneIcon } from './ContactActions';
import { authHref, creditsLeft, useContact } from '@/lib/useContact';

function PopupBody({ contact, propertyTitle, href }) {
  const { status, phone, charged, freeCredits, message, fetchContact } = contact;

  if (status === 'done') {
    return (
      <>
        <p className="text-center text-2xl font-bold font-heading tracking-wide text-gray-900 mb-4">{phone}</p>
        <ContactActions phone={phone} propertyTitle={propertyTitle} callLabel="Call" />
        <p className="text-xs text-gray-500 text-center mt-3">
          {charged ? '1 credit used' : 'No credit used'}. {creditsLeft(freeCredits)}.
        </p>
      </>
    );
  }

  if (status === 'login') {
    return (
      <>
        <p className="text-sm text-gray-600 text-center mb-4">Log in to see this number. New accounts get 10 free credits.</p>
        <div className="grid grid-cols-2 gap-2">
          <Link href={authHref('login')} className="btn-primary !py-2.5 text-sm">Log in</Link>
          <Link href={authHref('signup')} className="btn-outline !py-2.5 text-sm">Sign up</Link>
        </div>
      </>
    );
  }

  if (status === 'no-credits') {
    return (
      <>
        <p className="text-sm font-semibold text-red-600 text-center">{message}</p>
        <p className="text-sm text-gray-600 text-center mt-1 mb-4">You can still send an inquiry from the property page.</p>
        <Link href={href} className="btn-primary w-full !py-2.5 text-sm">View property</Link>
      </>
    );
  }

  if (status === 'error') {
    return (
      <>
        <p className="text-sm text-red-600 text-center mb-4">{message}</p>
        <button type="button" onClick={fetchContact} className="btn-primary w-full !py-2.5 text-sm">Try again</button>
      </>
    );
  }

  return <p role="status" className="text-sm text-gray-500 text-center py-6">Getting contact...</p>;
}

function ContactPopup({ title, subtitle, onClose, children }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-popup-title"
        className="w-full max-w-sm bg-white rounded-2xl shadow-dropdown p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 id="contact-popup-title" className="font-bold font-heading text-lg text-gray-900 truncate">{title}</h2>
            <p className="text-sm text-gray-500 line-clamp-1">{subtitle}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 w-11 h-11 shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Contact button for a listing card. The popup is portalled to <body> because cards clip their
// content (overflow-hidden) and turn off pointer events for the full-card link underneath.
export default function ContactButton({ propertyId, propertyTitle, contactName, listingType, href, className = '' }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const contact = useContact(propertyId);
  const poster = listingType === 'owner' ? 'Owner' : 'Dealer';

  function openPopup(e) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    contact.fetchContact();
  }

  return (
    <>
      <button
        type="button"
        onClick={openPopup}
        className={`btn-primary relative z-10 pointer-events-auto h-11 !py-0 !px-5 text-sm gap-1.5 ${className}`}
      >
        <PhoneIcon />
        Contact
      </button>
      {open && createPortal(
        <ContactPopup title={contactName || `Contact ${poster}`} subtitle={propertyTitle} onClose={close}>
          <PopupBody contact={contact} propertyTitle={propertyTitle} href={href} />
        </ContactPopup>,
        document.body,
      )}
    </>
  );
}
