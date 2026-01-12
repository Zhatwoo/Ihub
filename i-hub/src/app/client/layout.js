'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Home', href: '/client' },
  { name: 'Private Offices', href: '/client/private-offices' },
  { name: 'Dedicated Desk', href: '/client/dedicated-desk' },
  { name: 'Virtual Office', href: '/client/virtual-office' },
  { name: 'My Bookings', href: '/client/bookings' },
  { name: 'Contact', href: '/client/contact' },
];

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  const isVirtualOffice = pathname === '/client/virtual-office';

  return (
    <div className="min-h-screen bg-slate-50">
      {!isVirtualOffice && (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/client" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-teal-600/20">🏢</div>
              <span className="text-xl font-bold text-slate-800">Inspire Hub</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === item.href ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-100 hover:text-slate-800'}`}>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </header>
      )}
      <main>{children}</main>
    </div>
  );
}
