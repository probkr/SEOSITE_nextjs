const COLORS = {
  green: 'bg-emerald-100 text-emerald-800',
  yellow: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
  purple: 'bg-violet-100 text-violet-800',
  blue: 'bg-blue-100 text-blue-800',
  orange: 'bg-orange-100 text-orange-800'
};

export default function Badge({ color = 'gray', children }) {
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${COLORS[color] || COLORS.gray}`}>{children}</span>;
}
