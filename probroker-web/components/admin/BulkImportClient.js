'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientFetch } from '@/lib/api';

function ResultCard({ result }) {
  if (!result) return null;
  const ok = (result.imported || 0) > 0 || (result.updated || 0) > 0;
  return (
    <div className={`mt-3 p-4 rounded-lg text-sm font-semibold ${ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
      <div>Total Processed: {result.total_processed ?? 0}</div>
      <div>Imported: {result.imported ?? 0} · Updated: {result.updated ?? 0} · Skipped: {result.skipped ?? 0} · Errors: {result.errors ?? 0}</div>
      <div>Areas Auto-Created: {result.areas_created ?? 0} · Societies Auto-Created: {result.societies_created ?? 0}</div>
      {result.error_details?.length > 0 && (
        <div className="mt-2 font-normal text-xs">
          {result.error_details.map((d, i) => <div key={i}>{d}</div>)}
        </div>
      )}
    </div>
  );
}

// The old FastAPI backend exposes both a synchronous bulk-import response and a
// job-polling endpoint (GET /api/admin/import-status/{job_id}) for larger payloads.
// We support both: if the immediate response includes a job_id (and no final
// counts yet), poll until the job reports done/failed.
async function pollJobStatus(jobId, onTick) {
  for (let i = 0; i < 2400; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const res = await clientFetch(`/admin/import-status/${jobId}`);
    if (!res.ok) continue;
    const data = await res.json();
    onTick(data);
    if (data.status === 'done' || data.status === 'completed' || data.status === 'failed' || data.finished) {
      return data;
    }
  }
  throw new Error('Still processing in the background -- refresh this page later to see final results.');
}

export default function BulkImportClient({ dbInfo }) {
  const router = useRouter();
  const jsonInputRef = useRef(null);
  const csvInputRef = useRef(null);
  const [jsonFile, setJsonFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [jsonBusy, setJsonBusy] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);
  const [seedBusy, setSeedBusy] = useState(false);
  const [jsonResult, setJsonResult] = useState(null);
  const [csvResult, setCsvResult] = useState(null);
  const [seedResult, setSeedResult] = useState(null);

  async function doJsonImport() {
    if (!jsonFile) return;
    setJsonBusy(true);
    setJsonResult(null);
    try {
      const text = await jsonFile.text();
      const data = JSON.parse(text);
      const res = await clientFetch('/admin/bulk-import', {
        method: 'POST',
        body: JSON.stringify(Array.isArray(data) ? data : [data])
      });
      let r = await res.json();
      if (r.job_id && r.imported === undefined) {
        setJsonResult({ ...r, errors: 0, imported: 0, updated: 0, status_message: 'Processing…' });
        r = await pollJobStatus(r.job_id, setJsonResult);
      }
      setJsonResult(r);
      if ((r.imported || 0) > 0 || (r.updated || 0) > 0) setTimeout(() => router.refresh(), 2000);
    } catch (e) {
      setJsonResult({ errors: 1, error_details: [e.message] });
    } finally {
      setJsonBusy(false);
    }
  }

  async function doCsvImport() {
    if (!csvFile) return;
    setCsvBusy(true);
    setCsvResult(null);
    try {
      const fd = new FormData();
      fd.append('csv_file', csvFile);
      const res = await clientFetch('/admin/bulk-import-csv', { method: 'POST', body: fd });
      let r = await res.json();
      if (r.job_id && r.imported === undefined) {
        setCsvResult({ ...r, errors: 0, imported: 0, updated: 0, status_message: 'Processing…' });
        r = await pollJobStatus(r.job_id, setCsvResult);
      }
      setCsvResult(r);
      if ((r.imported || 0) > 0 || (r.updated || 0) > 0) setTimeout(() => router.refresh(), 2000);
    } catch (e) {
      setCsvResult({ errors: 1, error_details: [e.message] });
    } finally {
      setCsvBusy(false);
    }
  }

  async function seedData() {
    setSeedBusy(true);
    setSeedResult(null);
    try {
      const res = await clientFetch('/admin/seed-sample-data', { method: 'POST' });
      const r = await res.json();
      setSeedResult(r);
      setTimeout(() => router.refresh(), 2000);
    } catch (e) {
      setSeedResult({ errors: 1, error_details: [e.message] });
    } finally {
      setSeedBusy(false);
    }
  }

  function downloadCsvTemplate() {
    const headers = 'propertyId,status,transactionType,category,propertyType,price,bhk,sqft,cityName,areaName,premiseName,floorNumber,totalFloors,furnishing,familyOrBachelors,parking,contactName,contactPhone,listingType,description,nearby,additionalDetails';
    const sample = ',active,buy,residential,flat,7500000,3,1450,Ahmedabad,Satellite,Shaligram Greens,5,12,semi-furnished,family,true,Owner Name,9876543210,broker,Spacious 3BHK flat with good ventilation,Near SG Highway,Well maintained society';
    const blob = new Blob([headers + '\n' + sample + '\n'], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'probroker_import_template.csv';
    a.click();
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Upload JSON File</div>
        <div className="p-5">
          <p className="text-sm text-gray-500 mb-3">Upload a JSON array of properties, either a CRM export (Proeprty-Details: title, type, rentValue, number, images…) or PRObroker fields. Existing propertyIds are updated; deleted, rented and sold rows are skipped (or taken down if already live).</p>
          <label className="block border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-primary">
            <input ref={jsonInputRef} type="file" accept=".json" className="hidden" onChange={(e) => setJsonFile(e.target.files[0] || null)} />
            <div className="text-3xl mb-2">📥</div>
            <p className="text-sm"><strong>Click to browse for a .json file</strong></p>
            <p className="text-[11px] text-gray-400 mt-1">Max 50MB</p>
          </label>
          {jsonFile && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md flex items-center gap-3">
              <span className="font-semibold text-sm">{jsonFile.name} ({(jsonFile.size / 1024).toFixed(1)} KB)</span>
              <button onClick={doJsonImport} disabled={jsonBusy} className="bg-primary text-white text-sm rounded-md px-4 py-1.5 font-semibold disabled:opacity-60">
                {jsonBusy ? 'Importing…' : 'Import Properties'}
              </button>
            </div>
          )}
          <ResultCard result={jsonResult} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Upload CSV File</div>
        <div className="p-5">
          <p className="text-sm text-gray-500 mb-3">Upload a CSV file with property data. First row must be column headers. UTF-8 encoding required.</p>
          <button onClick={downloadCsvTemplate} className="text-primary text-sm font-semibold mb-3">Download CSV Template</button>
          <label className="block border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-primary">
            <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => setCsvFile(e.target.files[0] || null)} />
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm"><strong>Click to browse for a .csv file</strong></p>
            <p className="text-[11px] text-gray-400 mt-1">Max 50MB</p>
          </label>
          {csvFile && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md flex items-center gap-3">
              <span className="font-semibold text-sm">{csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)</span>
              <button onClick={doCsvImport} disabled={csvBusy} className="bg-primary text-white text-sm rounded-md px-4 py-1.5 font-semibold disabled:opacity-60">
                {csvBusy ? 'Importing…' : 'Import CSV'}
              </button>
            </div>
          )}
          <ResultCard result={csvResult} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-5 py-4 border-b border-gray-200 font-bold text-gray-900">Seed Sample Data</div>
        <div className="p-5">
          <p className="text-sm text-gray-500 mb-3">Insert 20 sample PRObroker properties with auto-mapped fields, generated descriptions, and amenities.</p>
          <button onClick={seedData} disabled={seedBusy} className="bg-primary text-white text-sm rounded-md px-4 py-2 font-semibold disabled:opacity-60">
            {seedBusy ? 'Seeding…' : 'Insert 20 Sample Properties'}
          </button>
          <ResultCard result={seedResult} />
        </div>
      </div>
    </div>
  );
}
