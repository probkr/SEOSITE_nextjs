import Link from 'next/link';

const linkCls = 'font-semibold text-primary hover:underline underline-offset-2';

// "I agree to the Terms & Conditions and Privacy Policy" tick box for login and inquiry forms.
// Pass checked/onChange for a controlled box, or just `required` to let the browser enforce it.
export default function TermsCheckbox({ checked, onChange, required = false, invalid = false, error = '' }) {
  const controlled = onChange ? { checked, onChange: (e) => onChange(e.target.checked) } : {};
  return (
    <div>
      <label className="flex items-start gap-2.5 cursor-pointer text-sm text-gray-600 leading-snug text-left">
        <input
          type="checkbox"
          required={required}
          aria-invalid={invalid || !!error}
          className="mt-0.5 w-4 h-4 shrink-0 rounded accent-primary cursor-pointer"
          {...controlled}
        />
        <span>
          I agree to the{' '}
          <Link href="/terms/" target="_blank" className={linkCls}>Terms &amp; Conditions</Link>{' '}
          and{' '}
          <Link href="/privacy-policy/" target="_blank" className={linkCls}>Privacy Policy</Link>
        </span>
      </label>
      {error && <p className="mt-1 text-[13px] text-red-600">{error}</p>}
    </div>
  );
}
