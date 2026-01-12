'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Reports', href: '/admin/reports', icon: '📈' },
  { name: 'Dedicated Desk', href: '/admin/dedicated-desk', icon: '🪑' },
  { name: 'Private Office', href: '/admin/private-office', icon: '🏢' },
  { name: 'Virtual Office', href: '/admin/virtual-office', icon: '💻' },
  { name: 'Tenants', href: '/admin/tenants', icon: '👥' },
  { name: 'Billing', href: '/admin/billing', icon: '💳' },
];

const bottomNavItems = [
  { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col fixed h-screen shadow-xl justify-between z-50 transition-transform duration-300 ease-in-out`}>
        <div>
          <div className="p-4 lg:p-6 border-b border-white/10 bg-black/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-teal-600/30">🏢</div>
              <div className="flex flex-col">
                <span className="text-base lg:text-lg font-bold text-white leading-tight">Inspire Hub</span>
                <span className="text-xs text-white/60 tracking-wider uppercase">Admin Panel</span>
              </div>
            </div>
          </div>
          <nav className="flex flex-col p-2 lg:p-4 gap-1.5 overflow-y-auto">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-medium transition-all ${pathname === item.href ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-600/30' : 'text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1'}`}
              >
                <span className="mr-2 lg:mr-3.5 text-base lg:text-lg w-5 lg:w-6 text-center">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        <nav className="flex flex-col p-2 lg:p-4 gap-1.5 border-t border-white/10 mt-auto pt-4">
          {bottomNavItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-medium transition-all ${pathname === item.href ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-600/30' : 'text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1'}`}
            >
              <span className="mr-2 lg:mr-3.5 text-base lg:text-lg w-5 lg:w-6 text-center">{item.icon}</span>
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 lg:ml-64 w-full lg:w-auto">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center text-lg">🏢</div>
            <span className="text-sm font-bold text-slate-800">Inspire Hub</span>
          </div>
        </div>
        
        <main className="p-3 sm:p-4 lg:p-6 xl:p-8 bg-slate-50 min-h-screen w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
