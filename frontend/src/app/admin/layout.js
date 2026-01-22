'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ProfileCard from './ProfileCard/ProfileCard';
import ProfileModal from './ProfileCard/ProfileModal';
import AdminAuthGuard from '@/components/AdminAuthGuard.jsx';

// React Icons - Material Design Icons
import { MdDashboard, MdBusiness, MdTv, MdPeople, MdCreditCard, MdDesktopMac, MdApartment } from 'react-icons/md';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: MdDashboard },
  { name: 'Dedicated Desk', href: '/admin/dedicated-desk', icon: MdDesktopMac },
  { name: 'Private Office', href: '/admin/private-office', icon: MdBusiness },
  { name: 'Virtual Office', href: '/admin/virtual-office', icon: MdTv },
  { name: 'Tenants', href: '/admin/tenants', icon: MdPeople },
  { name: 'Billing', href: '/admin/billing', icon: MdCreditCard },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Clean up old localStorage token and cache data on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Remove old token storage from localStorage (now using cookies)
    const oldTokenKeys = ['idToken', 'refreshToken', 'user'];
    oldTokenKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Remove old admin cache and admin info from localStorage (now using cookies)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('adminAuth_') || key.startsWith('adminInfo_'))) {
        localStorage.removeItem(key);
      }
    }
    
    // Remove other app-related localStorage data
    const keysToRemove = [
      'calendar-tasks', 'kanban-columns', 'reports-data', 'currentCompanyId',
      'userLocationInfo', 'scheduleStart', 'scheduleEnd', 'siteVisitCount',
      'systemStyle', 'wallpaper', 'weather_cloud_pos', 'websdk_ng_cache_parameter',
      'websdk_ng_global_parameter', 'websdk_ng_install_id', 'informationReadFilter',
      'isDockMode', 'shownToastIds', 'advertisementVideoUrl', 'auth_migration_v1_completed'
    ];
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Hide sidebar on register page
  const isRegisterPage = pathname === '/admin/register';

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies
      await api.logout();
      // Redirect to landing page after logout
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, redirect (cookies might still be cleared)
      router.push('/');
    }
  };

  return (
    <AdminAuthGuard>
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {!isRegisterPage && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden modal-backdrop-enter" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Hidden on register page */}
      {!isRegisterPage && (
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col fixed h-screen shadow-xl justify-between z-50 transition-all duration-300 ease-out`}>
        <div>
          <div className={`p-4 lg:p-6 border-b border-white/10 bg-black/10 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/30 transition-transform duration-300 hover:scale-105">
                <MdApartment size={24} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base lg:text-lg font-bold text-white leading-tight">Inspire Hub</span>
                <span className="text-xs text-white/60 tracking-wider uppercase">Admin Panel</span>
              </div>
            </div>
          </div>
          <nav className="flex flex-col p-2 lg:p-4 gap-1.5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {navItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-medium transition-all duration-200 nav-item-animate ${pathname === item.href ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg shadow-teal-600/30' : 'text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1'}`}
                style={{ 
                  animationDelay: `${index * 0.05}s`,
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateX(0)' : 'translateX(-10px)',
                  transition: `opacity 0.3s ease-out ${index * 0.05}s, transform 0.3s ease-out ${index * 0.05}s`
                }}
              >
                <span className="mr-2 lg:mr-3.5 w-5 lg:w-6 flex items-center justify-center">
                  <IconComponent size={20} />
                </span>
                <span className="truncate">{item.name}</span>
              </Link>
            );
            })}
          </nav>
        </div>
        <nav className={`flex flex-col p-2 lg:p-4 gap-1.5 border-t border-white/10 mt-auto pt-4 transition-all duration-500 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <ProfileCard onClick={() => {
            setShowProfileModal(true);
            setSidebarOpen(false);
          }} />
          <button
            onClick={() => {
              handleLogout();
              setSidebarOpen(false);
            }}
            className="flex items-center px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-medium transition-all duration-200 bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 text-white mt-1 btn-press"
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
        <div className={`lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-30 transition-all duration-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
              <MdApartment size={20} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">Inspire Hub</span>
          </div>
        </div>
        )}
        
        <main className={`${!isRegisterPage ? 'p-3 sm:p-4 lg:p-6 xl:p-8 pb-12' : ''} bg-slate-50 min-h-screen w-full overflow-x-hidden overflow-y-auto`}>
          <div className={`transition-all duration-500 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {children}
          </div>
        </main>
      </div>
      
      {/* Profile Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
    </AdminAuthGuard>
  );
}
