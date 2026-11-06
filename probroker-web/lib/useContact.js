'use client';

import { useCallback, useState } from 'react';
import { clientFetchJson } from './api';
import { notifyCredits } from './webUser';

// Where to send a guest, bringing them back to this exact page (filters included) afterwards.
export function authHref(mode) {
  return `/auth/${mode}/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}

export const creditsLeft = (n) => `${n} free ${n === 1 ? 'credit' : 'credits'} left`;

// One credit-checked unlock, shared by the property page and the listing-card popup. The number
// never ships with a page: it only arrives here. status is idle | loading | done | login |
// no-credits | error, and fetchContact resolves to that same status.
export function useContact(propertyId) {
  const [state, setState] = useState({ status: 'idle' });

  const fetchContact = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const res = await clientFetchJson('/properties/contact', { method: 'POST', body: { propertyId } });
      notifyCredits(res.freeCredits);
      setState({ status: 'done', phone: res.contactPhone, charged: res.charged, freeCredits: res.freeCredits });
      return 'done';
    } catch (err) {
      const code = err.data?.code;
      if (code === 'NO_CREDITS') notifyCredits(err.data.freeCredits);
      const status = err.status === 401 ? 'login' : code === 'NO_CREDITS' ? 'no-credits' : 'error';
      setState({ status, message: err.status ? err.message : 'Something went wrong. Please try again.' });
      return status;
    }
  }, [propertyId]);

  return { ...state, fetchContact };
}
