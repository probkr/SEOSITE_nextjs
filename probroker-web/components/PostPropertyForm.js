'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { postJson } from '@/lib/api';
import { API_URL } from '@/lib/config';

const PROPERTY_TYPES = {
  residential: ['flat', 'bungalow', 'tenement', 'penthouse', 'plot'],
  commercial: ['office', 'shop', 'showroom', 'warehouse'],
};
const CITIES = [
  { slug: 'ahmedabad', name: 'Ahmedabad' },
  { slug: 'gandhinagar', name: 'Gandhinagar' },
];
const BENEFITS = [
  { title: 'Zero Brokerage', desc: 'List directly as an owner — no commission, no middlemen.' },
  { title: 'Verified Badge', desc: 'Approved listings carry a verified badge that buyers trust.' },
  { title: 'Direct Enquiries', desc: 'Interested buyers and tenants contact you directly, instantly.' },
  { title: 'Free Forever', desc: 'Posting your property on PRObroker costs nothing, always.' },
];
const HOW_IT_WORKS = [
  { step: '1', title: 'Basic Details', desc: 'Category, property type, your contact number and society name.' },
  { step: '2', title: 'Property Details', desc: 'Price, size, furnishing and other specifics buyers look for.' },
  { step: '3', title: 'Photos & Submit', desc: 'Add photos and submit — our team reviews and publishes it.' },
];

function Stepper({ stage }) {
  const steps = [
    { key: 'basic', label: 'Basic Details' },
    { key: 'details', label: 'Property Details' },
    { key: 'photos', label: 'Photos & Submit' },
  ];
  const idx = steps.findIndex((s) => s.key === stage);
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= idx ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
              {i < idx ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i <= idx ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`w-8 sm:w-16 h-0.5 ${i < idx ? 'bg-primary' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );
}

const inputCls = 'w-full border-2 border-gray-200 rounded-lg px-3.5 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1.5';

export default function PostPropertyForm({ stats }) {
  const [stage, setStage] = useState('landing'); // landing -> basic -> details -> photos -> done
  const [otpStep, setOtpStep] = useState('enter'); // enter -> sent -> verified
  const [otpStatus, setOtpStatus] = useState(null);
  const [draftId, setDraftId] = useState(null);
  const [listingId, setListingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    category: 'residential', transactionType: 'buy', propertyType: 'flat',
    contactName: '', contactPhone: '', otp: '',
    city: 'ahmedabad', area: '', premiseName: '',
    bhk: '', sqft: '', price: '', furnishing: 'unfurnished',
    floorNumber: '', totalFloors: '', ageOfProperty: '', parking: false, description: '', nearby: '',
    videoUrl: '',
  });
  const [photos, setPhotos] = useState([]); // [{url, uploading}]

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function sendOtp(e) {
    e.preventDefault();
    setOtpStatus('sending');
    const res = await postJson('/otp/send', { phone: form.contactPhone, name: form.contactName, purpose: 'post-property' });
    if (res.ok) {
      setOtpStep('sent');
      setOtpStatus(null);
    } else {
      setOtpStatus('error');
    }
  }

  async function verifyOtpAndSaveDraft(e) {
    e.preventDefault();
    setOtpStatus('verifying');
    const res = await postJson('/otp/verify', { phone: form.contactPhone, otp: form.otp, purpose: 'post-property' });
    if (!res.ok) {
      setOtpStatus('invalid');
      return;
    }
    setOtpStep('verified');
    setSaving(true);
    const draftRes = await postJson('/save-partial-property', {
      contactPhone: form.contactPhone,
      contactName: form.contactName,
      category: form.category,
      transactionType: form.transactionType,
      propertyType: form.propertyType,
      city: form.city,
      area: form.area,
      premiseName: form.premiseName,
      completionPercent: 33,
    });
    setSaving(false);
    if (draftRes.ok && draftRes.data?.draftId) {
      setDraftId(draftRes.data.draftId);
    }
    setStage('details');
  }

  async function saveDetailsAndContinue(e) {
    e.preventDefault();
    setSaving(true);
    await postJson('/save-partial-property', {
      draftId,
      contactPhone: form.contactPhone,
      contactName: form.contactName,
      category: form.category,
      transactionType: form.transactionType,
      propertyType: form.propertyType,
      city: form.city,
      area: form.area,
      premiseName: form.premiseName,
      bhk: form.bhk,
      sqft: form.sqft,
      price: form.price,
      furnishing: form.furnishing,
      completionPercent: 66,
    });
    setSaving(false);
    setStage('photos');
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'properties');
      try {
        const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (data?.url) {
          setPhotos((p) => [...p, data.url]);
        }
      } catch {
        // skip failed upload, user can retry
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removePhoto(url) {
    setPhotos((p) => p.filter((u) => u !== url));
  }

  async function submitListing(e) {
    e.preventDefault();
    setSubmitError(null);
    setSaving(true);
    const res = await postJson('/post-property', {
      draftId,
      category: form.category,
      transactionType: form.transactionType,
      propertyType: form.propertyType,
      city: form.city,
      area: form.area,
      premiseName: form.premiseName,
      bhk: form.bhk || undefined,
      sqft: form.sqft || undefined,
      price: form.price,
      furnishing: form.furnishing,
      floorNumber: form.floorNumber || undefined,
      totalFloors: form.totalFloors || undefined,
      ageOfProperty: form.ageOfProperty || undefined,
      parking: form.parking,
      description: form.description,
      nearby: form.nearby,
      additionalDetails: form.videoUrl ? `Video: ${form.videoUrl}` : '',
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      listingType: 'owner',
      source: 'owner',
      status: 'pending',
      photoUrls: photos,
    });
    setSaving(false);
    if (res.ok) {
      setListingId(res.data?.propertyId);
      setStage('done');
    } else {
      setSubmitError(res.data?.message || 'Something went wrong. Please try again.');
    }
  }

  // ---------------- LANDING ----------------
  if (stage === 'landing') {
    return (
      <div>
        <section className="bg-brand-hero">
          <div className="container-px py-16 text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold font-heading text-white tracking-tight">
              Post Your Property <span className="text-accent-500">FREE</span>
            </h1>
            <p className="mt-4 text-primary-100 text-lg max-w-2xl mx-auto">
              Reach thousands of genuine buyers and tenants in Ahmedabad &amp; Gandhinagar &mdash; zero brokerage, ever.
            </p>
            <button onClick={() => setStage('basic')} className="btn-accent mt-8 text-base !px-8 !py-3.5">
              Get Started &rarr;
            </button>
            <div className="mt-8 flex justify-center gap-8 text-white">
              <div>
                <div className="text-2xl font-extrabold font-heading">{stats?.listings || '2,800'}+</div>
                <div className="text-xs text-primary-100">Live Listings</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold font-heading">{stats?.societies || '1,000'}+</div>
                <div className="text-xs text-primary-100">Societies Covered</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold font-heading">₹0</div>
                <div className="text-xs text-primary-100">Brokerage</div>
              </div>
            </div>
          </div>
        </section>

        <section className="container-px section-py">
          <h2 className="text-2xl md:text-3xl font-bold font-heading mb-8 text-gray-900 text-center">Why Post on PRObroker?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card p-5 text-center">
                <div className="font-bold font-heading text-gray-900 mb-2">{b.title}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-50 border-y border-gray-100">
          <div className="container-px section-py">
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-8 text-gray-900 text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {HOW_IT_WORKS.map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold font-heading text-lg mx-auto mb-3">{s.step}</div>
                  <div className="font-bold text-gray-900 mb-1">{s.title}</div>
                  <p className="text-sm text-gray-600">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <button onClick={() => setStage('basic')} className="btn-primary text-base !px-8 !py-3.5">Post Your Property Now</button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ---------------- DONE ----------------
  if (stage === 'done') {
    return (
      <div className="container-px py-16">
        <div className="card p-8 max-w-lg mx-auto text-center">
          <div className="w-14 h-14 rounded-full bg-primary-50 text-primary flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
          <h2 className="font-bold font-heading text-xl text-gray-900 mb-2">Property Submitted!</h2>
          <p className="text-gray-600 mb-1">Thank you, {form.contactName}. Your listing {listingId ? `(#${listingId}) ` : ''}is pending review.</p>
          <p className="text-gray-500 text-sm mb-6">Our team verifies every listing before it goes live &mdash; this usually takes a few hours. We&apos;ll reach you on {form.contactPhone} if we need anything else.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn-primary">Back to Home</Link>
            <Link href="/my-properties/" className="btn-outline">View My Properties</Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- BASIC ----------------
  if (stage === 'basic') {
    return (
      <div className="container-px py-10 max-w-2xl mx-auto">
        <Stepper stage="basic" />
        <div className="card p-6 sm:p-8">
          <h2 className="font-bold font-heading text-xl text-gray-900 mb-1">Basic Details</h2>
          <p className="text-sm text-gray-500 mb-6">Tell us a little about your property to get started.</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={form.category} onChange={(e) => { set('category', e.target.value); set('propertyType', PROPERTY_TYPES[e.target.value][0]); }}>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Property Type</label>
              <select className={inputCls} value={form.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                {PROPERTY_TYPES[form.category].map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={labelCls}>City</label>
              <select className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)}>
                {CITIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Society / Premise Name</label>
              <input placeholder="e.g. Shyamal Row House" className={inputCls} value={form.premiseName} onChange={(e) => set('premiseName', e.target.value)} />
            </div>
          </div>

          <div className="mb-4">
            <label className={labelCls}>Area / Locality</label>
            <input placeholder="e.g. Bopal, Satellite..." className={inputCls} value={form.area} onChange={(e) => set('area', e.target.value)} />
          </div>

          <div className="mb-4">
            <label className={labelCls}>Your Name</label>
            <input required placeholder="Full name" className={inputCls} value={form.contactName} onChange={(e) => set('contactName', e.target.value)} disabled={otpStep === 'verified'} />
          </div>

          {otpStep !== 'verified' ? (
            <form onSubmit={otpStep === 'enter' ? sendOtp : verifyOtpAndSaveDraft}>
              <div className="mb-2">
                <label className={labelCls}>Mobile Number</label>
                <div className="flex gap-2">
                  <input required type="tel" pattern="[0-9]{10}" placeholder="10-digit mobile number" className={inputCls}
                    value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} disabled={otpStep === 'sent'} />
                  {otpStep === 'enter' && (
                    <button type="submit" className="btn-primary shrink-0 !px-5" disabled={otpStatus === 'sending' || !form.contactName}>
                      {otpStatus === 'sending' ? 'Sending...' : 'Send OTP'}
                    </button>
                  )}
                </div>
              </div>
              {otpStep === 'sent' && (
                <div className="mt-3">
                  <label className={labelCls}>Enter OTP</label>
                  <div className="flex gap-2">
                    <input required placeholder="6-digit OTP" className={inputCls} value={form.otp} onChange={(e) => set('otp', e.target.value)} />
                    <button type="submit" className="btn-primary shrink-0 !px-5" disabled={otpStatus === 'verifying'}>
                      {otpStatus === 'verifying' ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                  {otpStatus === 'invalid' && <p className="text-red-600 text-sm mt-1.5">Invalid OTP, please try again.</p>}
                </div>
              )}
            </form>
          ) : (
            <div className="rounded-lg bg-primary-50 text-primary text-sm font-medium px-3.5 py-2.5 flex items-center gap-2">
              <span>✓</span> {form.contactPhone} verified{saving ? ' — saving draft...' : ''}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------- DETAILS ----------------
  if (stage === 'details') {
    return (
      <div className="container-px py-10 max-w-2xl mx-auto">
        <Stepper stage="details" />
        <form onSubmit={saveDetailsAndContinue} className="card p-6 sm:p-8 space-y-4">
          <h2 className="font-bold font-heading text-xl text-gray-900 mb-1">Property Details</h2>
          <p className="text-sm text-gray-500 mb-2">Add specifics buyers and tenants look for.</p>

          <div className="grid grid-cols-2 gap-3">
            <select className={inputCls} value={form.transactionType} onChange={(e) => set('transactionType', e.target.value)}>
              <option value="buy">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
            <input placeholder="BHK" type="number" min="0" className={inputCls} value={form.bhk} onChange={(e) => set('bhk', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Built-up Area (sqft)" type="number" className={inputCls} value={form.sqft} onChange={(e) => set('sqft', e.target.value)} />
            <input required placeholder="Price (₹)" type="number" className={inputCls} value={form.price} onChange={(e) => set('price', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select className={inputCls} value={form.furnishing} onChange={(e) => set('furnishing', e.target.value)}>
              <option value="unfurnished">Unfurnished</option>
              <option value="semi-furnished">Semi-furnished</option>
              <option value="fully-furnished">Fully-furnished</option>
            </select>
            <input placeholder="Age of Property (years)" type="number" className={inputCls} value={form.ageOfProperty} onChange={(e) => set('ageOfProperty', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Floor Number" type="number" className={inputCls} value={form.floorNumber} onChange={(e) => set('floorNumber', e.target.value)} />
            <input placeholder="Total Floors" type="number" className={inputCls} value={form.totalFloors} onChange={(e) => set('totalFloors', e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.parking} onChange={(e) => set('parking', e.target.checked)} />
            Parking available
          </label>

          <div>
            <label className={labelCls}>Nearby Landmarks</label>
            <input placeholder="e.g. Near SG Highway, 5 min from metro" className={inputCls} value={form.nearby} onChange={(e) => set('nearby', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea rows={4} placeholder="Describe your property..." className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStage('basic')} className="btn-outline flex-1">Back</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? 'Saving...' : 'Continue'}</button>
          </div>
        </form>
      </div>
    );
  }

  // ---------------- PHOTOS ----------------
  if (stage === 'photos') {
    return (
      <div className="container-px py-10 max-w-2xl mx-auto">
        <Stepper stage="photos" />
        <form onSubmit={submitListing} className="card p-6 sm:p-8 space-y-4">
          <h2 className="font-bold font-heading text-xl text-gray-900 mb-1">Photos &amp; Final Review</h2>
          <p className="text-sm text-gray-500 mb-2">Listings with photos get significantly more enquiries.</p>

          <div>
            <label className={labelCls}>Property Photos</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFiles}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary file:font-semibold hover:file:bg-primary-100" />
            {uploading && <p className="text-sm text-primary mt-2">Uploading...</p>}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                {photos.map((url) => (
                  <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Property" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(url)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>Video Link (optional)</label>
            <input placeholder="YouTube video URL" className={inputCls} value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} />
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-sm text-gray-600">
            <div className="font-semibold text-gray-900 mb-1">Quick Review</div>
            {form.propertyType} &middot; {form.category} &middot; {form.transactionType === 'rent' ? 'For Rent' : 'For Sale'} &middot; {form.premiseName || 'No society name'}, {form.area || form.city}
            {form.price ? ` — ₹${form.price}` : ''}
          </div>

          {submitError && <p className="text-red-600 text-sm">{submitError}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStage('details')} className="btn-outline flex-1">Back</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving || uploading}>{saving ? 'Submitting...' : 'Submit for Review'}</button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}
