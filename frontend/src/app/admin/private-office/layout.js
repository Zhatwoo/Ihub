'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function PrivateOfficeLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname.includes('/dashboard')) return 'dashboard';
    if (pathname.includes('/requests')) return 'requests';
    if (pathname.includes('/offices')) return 'offices';
    return 'dashboard'; // default to dashboard
  };

  const handleTabChange = (tab) => {
    const basePath = '/admin/private-office';
    switch (tab) {
      case 'dashboard':
        router.push(`${basePath}/dashboard`);
        break;
      case 'requests':
        router.push(`${basePath}/requests`);
        break;
      case 'offices':
        router.push(`${basePath}/offices`);
        break;
      default:
        router.push(`${basePath}/dashboard`);
    }
  };

  const activeTab = getActiveTab();

  return (
    <div className="w-full animate-fadeIn">
      <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 animate-slideInLeft">Private Office</h1>
      
      <div className="flex flex-wrap gap-1 mb-4 sm:mb-6 border-b-2 border-gray-200">
        {[
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'offices', label: 'Private Offices' },
          { key: 'requests', label: 'Request List' }
        ].map(tab => (
          <button 
            key={tab.key} 
            onClick={() => handleTabChange(tab.key)} 
            className={`px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-medium transition-all border-b-[3px] -mb-0.5 whitespace-nowrap ${
              activeTab === tab.key 
                ? 'text-slate-800 border-teal-600' 
                : 'text-gray-500 border-transparent hover:text-slate-800 hover:bg-slate-800/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 xl:p-6 shadow-lg shadow-slate-800/5 border border-gray-200">
        {children}
      </div>
    </div>
  );
}