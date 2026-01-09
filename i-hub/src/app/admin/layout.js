'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Reports', href: '/admin/reports', icon: '📈' },
  { name: 'Billing', href: '/admin/billing', icon: '💳' },
  { name: 'Private Office', href: '/admin/private-office', icon: '🏢' },
  { name: 'Tenants', href: '/admin/tenants', icon: '👥' },
  { name: 'Map', href: '/admin/map', icon: '🗺️' },
];

const bottomNavItems = [
  { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col fixed h-screen shadow-xl justify-between">
        <div>
          <div className="p-6 border-b border-white/10 bg-black/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-teal-600/30">🏢</div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white leading-tight">Inspire Hub</span>
                <span className="text-xs text-white/60 tracking-wider uppercase">Admin Panel</span>
              </div>
            </div>
          </div>
          <nav className="flex flex-col p-4 gap-1.5">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href} className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${pathname === item.href ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-600/30' : 'text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1'}`}>
                <span className="mr-3.5 text-lg w-6 text-center">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        <nav className="flex flex-col p-4 gap-1.5 border-t border-white/10 mt-auto pt-4">
          {bottomNavItems.map((item) => (
            <Link key={item.name} href={item.href} className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${pathname === item.href ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-600/30' : 'text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1'}`}>
              <span className="mr-3.5 text-lg w-6 text-center">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 ml-64 p-8 bg-slate-50 min-h-screen">{children}</main>
    </div>
  );
}
