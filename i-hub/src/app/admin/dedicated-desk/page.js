'use client';

import { useState } from 'react';
import EditFloor from './edit-floor/EditFloor';
import AssignDesk from './assign-desk/AssignDesk';

export default function DedicatedDesk() {
  const [activeTab, setActiveTab] = useState('edit-floor');

  return (
    <div className="w-full">
      <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Dedicated Desk</h1>
      
      <div className="flex flex-wrap gap-1 mb-4 sm:mb-6 border-b-2 border-gray-200 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('edit-floor')} 
          className={`px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-medium transition-all border-b-[3px] -mb-0.5 whitespace-nowrap ${
            activeTab === 'edit-floor' 
              ? 'text-slate-800 border-teal-600' 
              : 'text-gray-500 border-transparent hover:text-slate-800 hover:bg-slate-800/5'
          }`}
        >
          Edit Floor
        </button>
        <button 
          onClick={() => setActiveTab('assign-desk')} 
          className={`px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-medium transition-all border-b-[3px] -mb-0.5 whitespace-nowrap ${
            activeTab === 'assign-desk' 
              ? 'text-slate-800 border-teal-600' 
              : 'text-gray-500 border-transparent hover:text-slate-800 hover:bg-slate-800/5'
          }`}
        >
          Assign Desk
        </button>
      </div>

      <div className="animate-fadeIn">
        {activeTab === 'edit-floor' && <EditFloor />}
        {activeTab === 'assign-desk' && <AssignDesk />}
      </div>
    </div>
  );
}

