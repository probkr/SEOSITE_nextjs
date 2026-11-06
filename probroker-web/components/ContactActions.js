export function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
  );
}

// Call + WhatsApp buttons for an unlocked number.
export default function ContactActions({ phone, propertyTitle, callLabel = phone }) {
  const message = `Hi, I'm interested in ${propertyTitle} listed on PRObroker.`;
  return (
    <div className="grid grid-cols-2 gap-2">
      <a href={`tel:${phone}`} className="btn-primary !py-2.5 text-sm flex items-center justify-center gap-1.5">
        <PhoneIcon />
        {callLabel}
      </a>
      <a
        href={`https://wa.me/91${phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="!py-2.5 text-sm flex items-center justify-center gap-1.5 rounded-lg border-2 border-green-500 text-green-600 font-semibold hover:bg-green-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.13a8.2 8.2 0 01-4.18-1.14l-.3-.18-3.11.82.83-3.03-.2-.31a8.17 8.17 0 01-1.26-4.38c0-4.53 3.69-8.22 8.23-8.22 2.2 0 4.26.86 5.82 2.41a8.16 8.16 0 012.4 5.81c0 4.54-3.69 8.22-8.23 8.22z" /></svg>
        WhatsApp
      </a>
    </div>
  );
}
