'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);

  // Fetch tenants from Firebase (assuming a 'tenants' collection exists)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'tenants'), (snapshot) => {
      const tenantsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTenants(tenantsData);
    }, (error) => {
      // Handle error gracefully if collection doesn't exist yet
      console.log('Tenants collection not found yet. Using placeholder data.');
      setTenants([]);
    });
    return () => unsubscribe();
  }, []);

  // Get tenants by type
  const getTenantsByType = (type) => {
    if (!type) return tenants;
    return tenants.filter(t => t.type === type);
  };

  // Calculate counts for each type
  const getCountByType = (type) => {
    return tenants.filter(t => t.type === type).length;
  };

  // Define the three stat cards
  const statCards = [
    { 
      key: 'dedicated-desk', 
      icon: '🪑', 
      label: 'Dedicated Desk', 
      color: 'border-l-teal-600', 
      iconBg: 'from-teal-50 to-teal-100', 
      ring: 'ring-teal-600 shadow-teal-600/20',
    },
    { 
      key: 'private-office', 
      icon: '🏢', 
      label: 'Private Office', 
      color: 'border-l-blue-600', 
      iconBg: 'from-blue-50 to-blue-100', 
      ring: 'ring-blue-600 shadow-blue-600/20',
    },
    { 
      key: 'virtual-office', 
      icon: '☁️', 
      label: 'Virtual Office', 
      color: 'border-l-indigo-600', 
      iconBg: 'from-indigo-50 to-indigo-100', 
      ring: 'ring-indigo-600 shadow-indigo-600/20',
    },
  ];

  const filteredTenants = selectedFilter ? getTenantsByType(selectedFilter) : [];

  return (
    <div className="max-w-6xl">
      <h1 className="text-slate-800 text-3xl font-bold mb-8">Tenants</h1>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {statCards.map(card => (
          <div 
            key={card.key} 
            onClick={() => setSelectedFilter(selectedFilter === card.key ? null : card.key)} 
            className={`bg-white rounded-xl p-6 flex items-center gap-4 border border-gray-200 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-800/10 border-l-[4px] ${card.color} ${selectedFilter === card.key ? `ring-2 ${card.ring} -translate-y-0.5 shadow-xl` : 'shadow-sm'}`}
          >
            <div className={`text-2xl w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${card.iconBg} shrink-0 shadow-md`}>
              {card.icon}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-3xl font-bold text-slate-800 leading-tight">{getCountByType(card.key)}</span>
              <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filtered Tenants List (if a card is selected) */}
      {selectedFilter && (
        <div className="bg-white rounded-2xl p-7 shadow-lg shadow-slate-800/5 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              {statCards.find(c => c.key === selectedFilter)?.label} Tenants
            </h2>
            <button 
              onClick={() => setSelectedFilter(null)}
              className="text-sm text-gray-500 hover:text-slate-800 transition-colors"
            >
              Clear Filter
            </button>
          </div>
          
          {filteredTenants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">No tenants found</p>
              <p className="text-gray-400 text-sm">
                {tenants.length === 0 
                  ? 'No tenants have been added yet.' 
                  : `No tenants match the selected filter.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTenants.map((tenant) => (
                <div 
                  key={tenant.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100"
                >
                  <div>
                    <p className="text-slate-800 font-semibold">{tenant.name || 'Unnamed Tenant'}</p>
                    <p className="text-gray-500 text-sm">
                      {tenant.email || tenant.phone || 'No contact information'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 capitalize">
                    {tenant.status || 'active'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
