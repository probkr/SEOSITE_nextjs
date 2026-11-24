'use client';
import InquiryOtpForm from './InquiryOtpForm';

// Listing-page sidebar lead form. Guests confirm their number with an SMS OTP before it's sent.
export default function LeadCaptureCard({ context }) {
  return (
    <div className="card p-5 space-y-3">
      <div>
        <h3 className="font-bold font-heading text-lg text-gray-900">Need help finding a property?</h3>
        <p className="text-sm text-gray-500 mt-0.5">Share your requirement and our team will call you back.</p>
      </div>
      <InquiryOtpForm defaultMessage={`General inquiry: ${context || ''}`} requireOtp />
    </div>
  );
}
