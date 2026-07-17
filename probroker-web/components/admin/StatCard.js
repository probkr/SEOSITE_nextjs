export default function StatCard({ icon, value, label, borderColor = '#4D3C9A' }) {
  return (
    <div className="bg-white rounded-lg shadow p-5 relative" style={{ borderLeft: `4px solid ${borderColor}` }}>
      <span className="absolute top-4 right-4 text-2xl opacity-30">{icon}</span>
      <div className="text-2xl font-extrabold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
