'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import ProfileCard from './ProfileCard/ProfileCard';
import ProfileModal from './ProfileCard/ProfileModal';

// Modern desk SVG icon component
const DeskIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="4" rx="1" />
    <path d="M4 10v8" />
    <path d="M20 10v8" />
    <path d="M12 10v4" />
    <rect x="8" y="14" width="8" height="3" rx="0.5" />
  </svg>
);

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Reports', href: '/admin/reports', icon: '📈' },
  { name: 'Dedicated Desk', href: '/admin/dedicated-desk', icon: 'desk', isSvg: true },
  { name: 'Private Office', href: '/admin/private-office', icon: '🏢' },
  { name: 'Virtual Office', href: '/admin/virtual-office', icon: '💻' },
  { name: 'Tenants', href: '/admin/tenants', icon: '👥' },
  { name: 'Billing', href: '/admin/billing', icon: '💳' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Hide sidebar on register page
  const isRegisterPage = pathname === '/admin/register';

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      // Redirect to landing page after logout
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, redirect to landing page
      router.push('/');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {!isRegisterPage && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Hidden on register page */}
      {!isRegisterPage && (
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
                {item.isSvg ? (
                  <span className="mr-2 lg:mr-3.5 w-5 lg:w-6 flex items-center justify-center">
                    <DeskIcon className="w-5 h-5 lg:w-6 lg:h-6" />
                  </span>
                ) : (
                  <span className="mr-2 lg:mr-3.5 text-base lg:text-lg w-5 lg:w-6 text-center">{item.icon}</span>
                )}
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        <nav className="flex flex-col p-2 lg:p-4 gap-1.5 border-t border-white/10 mt-auto pt-4">
          <ProfileCard onClick={() => {
            setShowProfileModal(true);
            setSidebarOpen(false);
          }} />
          <button
            onClick={() => {
              handleLogout();
              setSidebarOpen(false);
            }}
            className="flex items-center px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-medium transition-all bg-red-600 hover:bg-red-700 text-white mt-1"
          >
            <svg className="mr-2 lg:mr-3.5 w-5 lg:w-6 h-5 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="truncate">Logout</span>
          </button>
        </nav>
      </aside>
      )}
      
      {/* Main content */}
      <div className={`flex-1 ${!isRegisterPage ? 'lg:ml-64' : ''} w-full lg:w-auto`}>
        {/* Mobile header - Hidden on register page */}
        {!isRegisterPage && (
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
        )}
        
        <main className={`${!isRegisterPage ? 'p-3 sm:p-4 lg:p-6 xl:p-8' : ''} bg-slate-50 min-h-screen w-full overflow-x-hidden`}>
          {children}
        </main>
      </div>
      
      {/* Profile Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
}
