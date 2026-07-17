'use client';

import { useState } from 'react';
import { clientFetch, clientFetchJson } from '@/lib/api';

export default function SettingsClient({ settings, homepageSchema }) {
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwSaving, setPwSaving] = useState(false);

  const [siteForm, setSiteForm] = useState({
    site_name: settings.site_name || 'PRObroker',
    contact_phone: settings.contact_phone || '',
    whatsapp: settings.whatsapp || ''
  });
  const [siteMsg, setSiteMsg] = useState(null);
  const [siteSaving, setSiteSaving] = useState(false);

  const [r2Status, setR2Status] = useState(null);
  const [r2Testing, setR2Testing] = useState(false);

  const [schema, setSchema] = useState(homepageSchema || '');
  const [schemaError, setSchemaError] = useState('');
  const [schemaMsg, setSchemaMsg] = useState(null);
  const [schemaSaving, setSchemaSaving] = useState(false);

  async function savePassword(e) {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.new_password !== pwForm.confirm_password) { setPwMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    if (pwForm.new_password.length < 6) { setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    setPwSaving(true);
    try {
      await clientFetchJson('/admin/settings/password', { method: 'POST', body: JSON.stringify(pwForm) });
      setPwMsg({ type: 'success', text: 'Password updated successfully' });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message });
    } finally {
      setPwSaving(false);
    }
  }

  async function saveSite(e) {
    e.preventDefault();
    setSiteMsg(null);
    setSiteSaving(true);
    try {
      await clientFetchJson('/admin/settings/site', { method: 'POST', body: JSON.stringify(siteForm) });
      setSiteMsg({ type: 'success', text: 'Settings saved successfully' });
    } catch (err) {
      setSiteMsg({ type: 'error', text: err.message });
    } finally {
      setSiteSaving(false);
    }
  }

  async function testR2() {
    setR2Testing(true);
    setR2Status(null);
    try {
      const res = await clientFetch('/admin/r2-status');
      const data = await res.json();
      setR2Status(data);
    } catch (e) {
      setR2Status({ connection: { connected: false, error: e.message } });
    } finally {
      setR2Testing(false);
    }
  }

  async function saveSchema(e) {
    e.preventDefault();
    setSchemaMsg(null);
    if (schema.trim()) {
      try { JSON.parse(schema.trim()); setSchemaError(''); }
      catch (err) { setSchemaError('Invalid JSON: ' + err.message); return; }
    }
    setSchemaSaving(true);
    try {
      await clientFetchJson('/admin/settings/homepage-schema', { method: 'POST', body: JSON.stringify({ homepage_schema: schema }) });
      setSchemaMsg({ type: 'success', text: 'Homepage schema saved' });
    } catch (err) {
      setSchemaMsg({ type: 'error', text: err.message });
    } finally {
      setSchemaSaving(false);
    }
  }

  async function clearSchema() {
    if (!confirm('Clear custom schema?')) return;
    try {
      await clientFetchJson('/admin/settings/homepage-schema', { method: 'DELETE' });
      setSchema('');
      setSchemaMsg({ type: 'success', text: 'Homepage schema cleared' });
    } catch (err) {
      setSchemaMsg({ type: 'error', text: err.message });
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-lg shadow">
          <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Change Password</div>
          <form onSubmit={savePassword} className="p-5">
            {pwMsg && <div className={`px-3 py-2 rounded mb-3 text-sm ${pwMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{pwMsg.text}</div>}
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Current Password</label>
              <input type="password" required className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">New Password</label>
              <input type="password" required minLength={6} className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Confirm New Password</label>
              <input type="password" required minLength={6} className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={pwForm.confirm_password} onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })} />
            </div>
            <button type="submit" disabled={pwSaving} className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60">{pwSaving ? 'Saving…' : 'Update Password'}</button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Site Settings</div>
          <form onSubmit={saveSite} className="p-5">
            {siteMsg && <div className={`px-3 py-2 rounded mb-3 text-sm ${siteMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{siteMsg.text}</div>}
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Site Name</label>
              <input className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={siteForm.site_name} onChange={(e) => setSiteForm({ ...siteForm, site_name: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">Contact Phone</label>
              <input type="tel" placeholder="For admin alerts" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={siteForm.contact_phone} onChange={(e) => setSiteForm({ ...siteForm, contact_phone: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1">WhatsApp Number</label>
              <input type="tel" placeholder="For property inquiries" className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-sm" value={siteForm.whatsapp} onChange={(e) => setSiteForm({ ...siteForm, whatsapp: e.target.value })} />
            </div>
            <button type="submit" disabled={siteSaving} className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60">{siteSaving ? 'Saving…' : 'Save Settings'}</button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-5">
        <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Cloudflare R2 Storage</div>
        <div className="p-5">
          <div className="bg-slate-900 rounded-lg p-4 mb-3 text-gray-300 text-sm">
            {!r2Status && <p className="text-center text-gray-400">Click &quot;Test Connection&quot; to check R2 status</p>}
            {r2Status?.connection?.connected && (
              <div>
                <div className="text-green-400 font-bold mb-2">✓ R2 Connected</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>Bucket: {r2Status.connection.bucket}</div>
                  <div>Total files: {r2Status.stats?.total_objects}</div>
                  <div>Storage used: {r2Status.stats?.total_size_mb} MB</div>
                </div>
              </div>
            )}
            {r2Status && !r2Status.connection?.connected && (
              <div>
                <div className="text-red-400 font-bold mb-1">✗ R2 Connection Failed</div>
                <div className="text-red-300 text-xs">Error: {r2Status.connection?.error || 'Unknown error'}</div>
              </div>
            )}
          </div>
          <button onClick={testR2} disabled={r2Testing} className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60">{r2Testing ? 'Testing…' : 'Test Connection'}</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Homepage Schema (JSON-LD)</div>
        <form onSubmit={saveSchema} className="p-5">
          <p className="text-xs text-gray-400 mb-3">Custom structured data for the homepage. Leave empty to use auto-generated default schema.</p>
          {schemaMsg && <div className={`px-3 py-2 rounded mb-3 text-sm ${schemaMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{schemaMsg.text}</div>}
          <textarea
            className="w-full border border-gray-200 rounded-md px-2.5 py-2 text-xs font-mono min-h-[200px]"
            placeholder='{"@context":"https://schema.org","@type":"RealEstateAgent","name":"PRObroker",...}'
            value={schema}
            onChange={(e) => setSchema(e.target.value)}
          />
          {schemaError && <div className="text-xs text-red-600 mt-1">{schemaError}</div>}
          <div className="flex gap-2 mt-3">
            <button type="submit" disabled={schemaSaving} className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60">{schemaSaving ? 'Saving…' : 'Save Homepage Schema'}</button>
            {schema && <button type="button" onClick={clearSchema} className="border border-gray-200 rounded-md px-4 py-2 text-sm">Clear Schema</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
