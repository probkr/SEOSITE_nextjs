'use client';
import { useState } from 'react';
import { postJson } from '@/lib/api';
import { CONTACT_CREDITS_ENABLED } from '@/lib/config';
import { useWebUser } from '@/lib/webUser';
import { authHref, creditsLeft, useContact } from '@/lib/useContact';
import ContactActions, { PhoneIcon } from './ContactActions';

export default function InquiryForm({ propertyId, propertyTitle, contactName, hasContact, listingType }) {
  const user = useWebUser();
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [status, setStatus] = useState(null);
  const contact = useContact(propertyId);
  const showContact = CONTACT_CREDITS_ENABLED && hasContact;

  async function getContact() {
    if ((await contact.fetchContact()) === 'login') window.location.href = authHref('login');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    const res = await postJson('/inquiries', { propertyId, ...form });
    setStatus(res.ok ? 'success' : 'error');
  }

  const inputCls = 'w-full border-2 border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';
  const posterLabel = listingType === 'owner' ? 'Owner' : 'Dealer';
  const initials = (contactName || 'P').trim().charAt(0).toUpperCase();

  return (
    <div className="space-y-4">
      {/* Owner / contact card */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-primary-100 text-primary font-bold flex items-center justify-center text-lg shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">{contactName || 'PRObroker Listing'}</div>
            <div className="text-xs text-gray-500">{posterLabel}</div>
          </div>
        </div>

        {showContact ? (
          contact.status === 'done' ? (
            <ContactActions phone={contact.phone} propertyTitle={propertyTitle} />
          ) : (
            <button
              type="button"
              onClick={getContact}
              disabled={contact.status === 'loading'}
              className="btn-primary w-full !py-2.5 text-sm flex items-center justify-center gap-1.5"
            >
              <PhoneIcon />
              {contact.status === 'loading' ? 'Getting contact...' : 'Get Contact'}
            </button>
          )
        ) : (
          <p className="text-sm text-gray-500">Contact number not available. Use the form below to reach out.</p>
        )}

        {(contact.status === 'error' || contact.status === 'no-credits') && <p className="text-red-600 text-sm mt-2">{contact.message}</p>}
        {showContact && user === null && (
          <p className="text-xs text-gray-500 mt-2">Log in to view this number. New accounts get 10 free credits.</p>
        )}
        {showContact && user && user.freeCredits !== undefined && (
          <p className="text-xs text-gray-500 mt-2">
            {contact.status === 'done'
              ? `${contact.charged ? '1 credit used' : 'No credit used'}. ${creditsLeft(user.freeCredits)}.`
              : `${creditsLeft(user.freeCredits)}. Each new contact uses 1 credit.`}
          </p>
        )}
      </div>

      {/* Inquiry form */}
      {status === 'success' ? (
        <div className="card p-5 text-center">
          <div className="text-primary font-semibold">Thank you! Your inquiry has been sent.</div>
          <p className="text-sm text-gray-500 mt-1">The {posterLabel.toLowerCase()} will contact you shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-5 space-y-3">
          <h3 className="font-bold font-heading text-lg text-gray-900">Send Inquiry</h3>
          <p className="text-sm text-gray-500 line-clamp-1">Interested in {propertyTitle}?</p>
          <input required placeholder="Your Name" className={inputCls}
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required placeholder="Phone Number" className={inputCls}
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input type="email" placeholder="Email (optional)" className={inputCls}
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <textarea placeholder="Message" rows={3} className={inputCls}
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <button type="submit" disabled={status === 'loading'} className="btn-primary w-full text-center">
            {status === 'loading' ? 'Sending...' : 'Send Inquiry'}
          </button>
          {status === 'error' && <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>}
        </form>
      )}
    </div>
  );
}
