'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Tenants() {
  const [privateOfficeTenants, setPrivateOfficeTenants] = useState([]);
  const [virtualOfficeTenants, setVirtualOfficeTenants] = useState([]);
  const [dedicatedDeskTenants, setDedicatedDeskTenants] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);

  // Fetch Private Office tenants from schedules collection (active reservations)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'schedules'), (snapshot) => {
      const schedulesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter for active tenants (status: active, upcoming, or ongoing)
      const activeTenants = schedulesData
        .filter(s => s.status === 'active' || s.status === 'upcoming' || s.status === 'ongoing')
        .map(s => ({
          id: s.id,
          type: 'private-office',
          name: s.clientName,
          email: s.email,
          phone: s.contactNumber,
          office: s.room,
          startDate: s.startDate,
          status: s.status === 'upcoming' || s.status === 'ongoing' ? 'active' : s.status,
          createdAt: s.createdAt
        }));
      setPrivateOfficeTenants(activeTenants);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Virtual Office tenants from virtual-office-clients collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'virtual-office-clients'), (snapshot) => {
      const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter out inquiries, only show confirmed tenants (status is not 'inquiry')
      const confirmedTenants = clientsData
        .filter(c => c.status !== 'inquiry')
        .map(c => ({
          id: c.id,
          type: 'virtual-office',
          name: c.fullName,
          email: c.email,
          phone: c.phoneNumber,
          company: c.company,
          position: c.position,
          startDate: c.dateStart || c.preferredStartDate,
          status: c.status || 'active',
          createdAt: c.createdAt
        }));
      setVirtualOfficeTenants(confirmedTenants);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Dedicated Desk tenants from desk-assignments collection
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'desk-assignments'), (snapshot) => {
      const assignmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const deskTenants = assignmentsData.map(assignment => ({
        id: assignment.id,
        type: 'dedicated-desk',
        desk: assignment.desk,
        name: assignment.name,
        email: assignment.email,
        phone: assignment.contactNumber,
        occupantType: assignment.type,
        company: assignment.company || null,
        startDate: assignment.assignedAt,
        status: 'active',
        createdAt: assignment.assignedAt || assignment.createdAt
      }));
      setDedicatedDeskTenants(deskTenants);
    });
    return () => unsubscribe();
  }, []);

  // Combine all tenants
  const allTenants = [...privateOfficeTenants, ...virtualOfficeTenants, ...dedicatedDeskTenants];

  // Get tenants by type
  const getTenantsByType = (type) => {
    if (type === 'private-office') return privateOfficeTenants;
    if (type === 'virtual-office') return virtualOfficeTenants;
    if (type === 'dedicated-desk') return dedicatedDeskTenants;
    return allTenants;
  };

  // Calculate counts for each type
  const getCountByType = (type) => {
    if (type === 'private-office') return privateOfficeTenants.length;
    if (type === 'virtual-office') return virtualOfficeTenants.length;
    if (type === 'dedicated-desk') return dedicatedDeskTenants.length;
    return allTenants.length;
  };

  // Define the three stat cards
  const statCards = [
    { 
      key: 'dedicated-desk', 
      icon: 'desk', 
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

  // Desk SVG icon component
  const DeskIcon = () => (
    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="4" rx="1" />
      <path d="M4 10v8" />
      <path d="M20 10v8" />
      <path d="M12 10v4" />
      <rect x="8" y="14" width="8" height="3" rx="0.5" />
    </svg>
  );

  const filteredTenants = selectedFilter ? getTenantsByType(selectedFilter) : [];

  return (
    <div className="w-full">
      <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Tenants</h1>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6">
        {statCards.map(card => (
          <div 
            key={card.key} 
            onClick={() => setSelectedFilter(selectedFilter === card.key ? null : card.key)} 
            className={`bg-white rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 border border-gray-200 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-800/10 border-l-[3px] sm:border-l-[4px] ${card.color} ${selectedFilter === card.key ? `ring-2 ${card.ring} -translate-y-0.5 shadow-xl` : 'shadow-sm'}`}
          >
            <div className={`text-lg sm:text-xl lg:text-2xl w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-gradient-to-br ${card.iconBg} shrink-0 shadow-sm sm:shadow-md`}>
              {card.icon === 'desk' ? <DeskIcon /> : card.icon}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">{getCountByType(card.key)}</span>
              <span className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wide whitespace-nowrap">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filtered Tenants List (if a card is selected) */}
      {selectedFilter && (
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 xl:p-7 shadow-lg shadow-slate-800/5 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 lg:mb-6 gap-3 sm:gap-0">
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
                {allTenants.length === 0 
                  ? 'No tenants have been added yet.' 
                  : `No tenants match the selected filter.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Contact</th>
                    {selectedFilter === 'private-office' && (
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Office</th>
                    )}
                    {selectedFilter === 'virtual-office' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Position</th>
                      </>
                    )}
                    {selectedFilter === 'dedicated-desk' && (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Desk</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Company</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Start Date</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                      <td className="px-4 py-4">
                        <p className="text-slate-800 font-semibold text-sm">{tenant.name || 'Unnamed Tenant'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-600 text-sm truncate max-w-[200px]" title={tenant.email || 'N/A'}>
                          {tenant.email || 'N/A'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-600 text-sm">{tenant.phone || 'N/A'}</p>
                      </td>
                      {selectedFilter === 'private-office' && (
                        <td className="px-4 py-4">
                          <p className="text-gray-600 text-sm">{tenant.office || 'N/A'}</p>
                        </td>
                      )}
                      {selectedFilter === 'virtual-office' && (
                        <>
                          <td className="px-4 py-4">
                            <p className="text-gray-600 text-sm truncate max-w-[150px]" title={tenant.company || 'N/A'}>
                              {tenant.company || 'N/A'}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-gray-600 text-sm truncate max-w-[120px]" title={tenant.position || 'N/A'}>
                              {tenant.position || 'N/A'}
                            </p>
                          </td>
                        </>
                      )}
                      {selectedFilter === 'dedicated-desk' && (
                        <>
                          <td className="px-4 py-4">
                            <p className="text-gray-600 text-sm font-semibold">{tenant.desk || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-gray-600 text-sm">{tenant.occupantType || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-gray-600 text-sm truncate max-w-[150px]" title={tenant.company || 'N/A'}>
                              {tenant.company || 'N/A'}
                            </p>
                          </td>
                        </>
                      )}
                      <td className="px-4 py-4">
                        <p className="text-gray-600 text-sm whitespace-nowrap">
                          {tenant.startDate ? new Date(tenant.startDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 capitalize">
                            {tenant.status || 'active'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
