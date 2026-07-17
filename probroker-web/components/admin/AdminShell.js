'use client';

import { usePathname, useRouter } from 'next/navigation';
import { clientFetch } from '@/lib/api';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '🏠', exact: true },
  { href: '/admin/listings', label: 'Properties', icon: '🏘️' },
  { href: '/admin/owner-listings', label: 'Pending Approval', icon: '⏳' },
  { divider: true },
  { href: '/admin/blog', label: 'Blog Posts', icon: '📝' },
  { href: '/admin/import', label: 'Bulk Import', icon: '📥' },
  { href: '/admin/areas', label: 'Areas', icon: '📍' },
  { href: '/admin/societies', label: 'Societies', icon: '🏢' },
  { href: '/admin/cities', label: 'Cities', icon: '🌆' },
  { divider: true },
  { href: '/admin/inquiries', label: 'Inquiries', icon: '📨' },
  { href: '/admin/pages', label: 'Pages', icon: '📄' },
  { href: '/admin/redirects', label: 'Redirects', icon: '🔀' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' }
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  async function handleLogout() {
    try {
      await clientFetch('/admin/logout', { method: 'POST' });
    } catch (e) {
      // ignore network errors, still redirect to login
    }
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed top-0 left-0 w-60 h-screen bg-sidebar text-white flex flex-col z-40 overflow-y-auto">
        <div className="px-4 pt-5 pb-3 border-b border-white/10">
          <div className="font-bold text-lg">PRObroker</div>
          <div className="text-[11px] text-white/50 tracking-wide">Admin Panel</div>
        </div>
        <nav className="flex-1 py-3">
          {NAV.map((item, i) => {
            if (item.divider) return <div key={i} className="h-px bg-white/10 my-2 mx-4" />;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium border-l-[3px] ${
                  active ? 'bg-white/15 text-white border-white' : 'text-white/70 border-transparent hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="w-5 text-center">{item.icon}</span>
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-white/10">
          <div className="text-[12px] text-white/50 mb-1.5">Logged in as <strong>admin</strong></div>
          <button onClick={handleLogout} className="text-[12px] font-semibold text-red-400 hover:opacity-80">
            ✖ Logout
          </button>
        </div>
      </aside>

      <header className="fixed top-0 left-60 right-0 h-14 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-6">
        <div className="font-bold text-lg text-gray-900">Admin</div>
        <a href="/" target="_blank" rel="noreferrer" className="text-[13px] border border-gray-200 rounded-md px-3.5 py-1.5 hover:border-primary hover:text-primary">
          View Site ↗
        </a>
      </header>

      <main className="ml-60 mt-14 p-6 min-h-[calc(100vh-56px)]">{children}</main>
    </div>
  );
}
