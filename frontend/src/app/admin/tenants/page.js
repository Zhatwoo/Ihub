'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '@/lib/api';

// React Icons - Material Design Icons
import { MdBusiness, MdTv, MdDesktopMac } from 'react-icons/md';

export default function Tenants() {
  const [privateOfficeTenants, setPrivateOfficeTenants] = useState([]);
  const [virtualOfficeTenants, setVirtualOfficeTenants] = useState([]);
  const [dedicatedDeskTenants, setDedicatedDeskTenants] = useState([]);
  const [stats, setStats] = useState({ privateOffice: 0, virtualOffice: 0, dedicatedDesk: 0, total: 0 });
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const tenantsIntervalRef = useRef(null);

  // Fetch all tenant data from backend
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        // Fetch processed tenant data from admin API - skip cache to get fresh data
        const response = await api.get('/api/admin/tenants/stats');
        
        if (response.success && response.data) {
          const { stats, tenants } = response.data;
          
          // Set processed tenant data from backend
          setPrivateOfficeTenants(tenants.privateOffice || []);
          setVirtualOfficeTenants(tenants.virtualOffice || []);
          setDedicatedDeskTenants(tenants.dedicatedDesk || []);
          setStats(stats);
        }
      } catch (error) {
        console.error('Error fetching tenants:', error);
        // Set empty fallbacks
        setPrivateOfficeTenants([]);
        setVirtualOfficeTenants([]);
        setDedicatedDeskTenants([]);
        setStats({ privateOffice: 0, virtualOffice: 0, dedicatedDesk: 0, total: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
    
    // Poll for updates every 15 minutes (increased to reduce Firestore reads)
    // Only poll when tab is visible to reduce unnecessary requests
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (tenantsIntervalRef.current) {
          clearInterval(tenantsIntervalRef.current);
          tenantsIntervalRef.current = null;
          console.log('⏸️ POLLING STOPPED: admin/tenants - /api/admin/tenants/stats (tab hidden)');
        }
      } else {
        // Only create interval if one doesn't already exist
        if (!tenantsIntervalRef.current) {
          fetchTenants(); // Fetch immediately when tab becomes visible
          tenantsIntervalRef.current = setInterval(() => {
            console.log('🔄 POLLING EXECUTED: admin/tenants - /api/admin/tenants/stats');
            api.get('/api/admin/tenants/stats').then(response => {
              if (response.success && response.data) {
                const { stats, tenants } = response.data;
                setPrivateOfficeTenants(tenants.privateOffice || []);
                setVirtualOfficeTenants(tenants.virtualOffice || []);
                setDedicatedDeskTenants(tenants.dedicatedDesk || []);
                setStats(stats);
              }
            }).catch(error => console.error('Error polling tenants:', error));
          }, 900000); // 15 minutes
          console.log('🔄 POLLING STARTED: admin/tenants - /api/admin/tenants/stats (15 min interval)');
        }
      }
    };
    
    // Start polling if tab is visible (only if no interval exists)
    if (!document.hidden && !tenantsIntervalRef.current) {
      tenantsIntervalRef.current = setInterval(() => {
        console.log('🔄 POLLING EXECUTED: admin/tenants - /api/admin/tenants/stats');
        api.get('/api/admin/tenants/stats').then(response => {
          if (response.success && response.data) {
            const { stats, tenants } = response.data;
            setPrivateOfficeTenants(tenants.privateOffice || []);
            setVirtualOfficeTenants(tenants.virtualOffice || []);
            setDedicatedDeskTenants(tenants.dedicatedDesk || []);
            setStats(stats);
          }
        }).catch(error => console.error('Error polling tenants:', error));
      }, 900000); // 15 minutes
      console.log('🔄 POLLING STARTED: admin/tenants - /api/admin/tenants/stats (15 min interval)');
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (tenantsIntervalRef.current) {
        clearInterval(tenantsIntervalRef.current);
        tenantsIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Combine all tenants - memoized to prevent infinite loops
  const allTenants = useMemo(() => [...privateOfficeTenants, ...virtualOfficeTenants, ...dedicatedDeskTenants], [privateOfficeTenants, virtualOfficeTenants, dedicatedDeskTenants]);

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
      icon: MdDesktopMac, 
      label: 'Dedicated Desk', 
      color: 'border-l-teal-600', 
      iconBg: 'from-teal-50 to-teal-100', 
      ring: 'ring-teal-600 shadow-teal-600/20',
    },
    { 
      key: 'private-office', 
      icon: MdBusiness, 
      label: 'Private Office', 
      color: 'border-l-blue-600', 
      iconBg: 'from-blue-50 to-blue-100', 
      ring: 'ring-blue-600 shadow-blue-600/20',
    },
    { 
      key: 'virtual-office', 
      icon: MdTv, 
      label: 'Virtual Office', 
      color: 'border-l-indigo-600', 
      iconBg: 'from-indigo-50 to-indigo-100', 
      ring: 'ring-indigo-600 shadow-indigo-600/20',
    },
  ];

  // Filter and sort tenants CLIENT-SIDE to avoid excessive API calls - memoized
  const filteredTenants = useMemo(() => {
    let filtered = [...allTenants];

    // Apply type filter
    if (selectedFilter) {
      filtered = filtered.filter(tenant => tenant.type === selectedFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(tenant =>
        (tenant.name && tenant.name.toLowerCase().includes(searchLower)) ||
        (tenant.email && tenant.email.toLowerCase().includes(searchLower)) ||
        (tenant.company && tenant.company.toLowerCase().includes(searchLower)) ||
        (tenant.phone && tenant.phone.toLowerCase().includes(searchLower)) ||
        (tenant.office && tenant.office.toLowerCase().includes(searchLower)) ||
        (tenant.desk && tenant.desk.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.name || a.clientName || '').localeCompare(b.name || b.clientName || '');
      } else if (sortBy === 'email') {
        comparison = (a.email || '').localeCompare(b.email || '');
      } else if (sortBy === 'office') {
        comparison = (a.room || '').localeCompare(b.room || '');
      } else if (sortBy === 'desk') {
        comparison = (a.desk || '').localeCompare(b.desk || '');
      } else if (sortBy === 'company') {
        comparison = (a.companyName || a.company || '').localeCompare(b.companyName || b.company || '');
      } else if (sortBy === 'type') {
        comparison = (a.type || '').localeCompare(b.type || '');
      } else if (sortBy === 'date') {
        comparison = new Date(a.startDate || 0) - new Date(b.startDate || 0);
      } else if (sortBy === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [allTenants, selectedFilter, searchTerm, sortBy, sortOrder]);

  // Get tenant type label
  const getTenantTypeLabel = (type) => {
    const typeMap = {
      'private-office': 'Private Office',
      'virtual-office': 'Virtual Office',
      'dedicated-desk': 'Dedicated Desk'
    };
    return typeMap[type] || type;
  };

  // Get tenant type color
  const getTenantTypeColor = (type) => {
    const colorMap = {
      'private-office': 'bg-blue-100 text-blue-700',
      'virtual-office': 'bg-indigo-100 text-indigo-700',
      'dedicated-desk': 'bg-teal-100 text-teal-700'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="w-full animate-fadeIn">
      <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 animate-slideInLeft">Tenants</h1>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6">
        {statCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
          <div 
            key={card.key} 
            onClick={() => setSelectedFilter(selectedFilter === card.key ? null : card.key)} 
            className={`bg-white rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 border border-gray-200 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-800/10 border-l-[3px] sm:border-l-[4px] ${card.color} ${selectedFilter === card.key ? `ring-2 ${card.ring} -translate-y-0.5 shadow-xl` : 'shadow-sm'}`}
            style={{ animation: `slideUp 0.5s ease-out ${index * 0.1}s both` }}
          >
            <style>{`
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes fadeInScale {
                from {
                  opacity: 0;
                  transform: scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
              @keyframes slideInDown {
                from {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-gradient-to-br ${card.iconBg} shrink-0 shadow-sm sm:shadow-md`}>
              <IconComponent size={20} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">{getCountByType(card.key)}</span>
              <span className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wide whitespace-nowrap">{card.label}</span>
            </div>
          </div>
        );
        })}
      </div>

      {/* All Tenants List Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 xl:p-7 shadow-lg shadow-slate-800/5 border border-gray-200" style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
        <div className="mb-4 sm:mb-5 lg:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            {selectedFilter 
              ? `${statCards.find(c => c.key === selectedFilter)?.label} Tenants`
              : 'All Tenants'}
          </h2>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            <div className="flex-1 sm:flex-none relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search tenants by name, email, phone, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
              >
                <option value="name">Sort by Name</option>
                {selectedFilter === 'private-office' && <option value="office">Sort by Office</option>}
                {selectedFilter === 'private-office' && <option value="company">Sort by Company</option>}
                {selectedFilter === 'dedicated-desk' && <option value="desk">Sort by Desk</option>}
                {selectedFilter === 'dedicated-desk' && <option value="company">Sort by Company</option>}
                <option value="date">Sort by Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:border-teal-600 transition-all whitespace-nowrap"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600 mb-4"></div>
            <p className="text-gray-500">Loading tenants...</p>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-gray-500 text-lg mb-2 font-semibold">No tenants found</p>
            <p className="text-gray-400 text-sm">
              {allTenants.length === 0 
                ? 'No tenants have been added yet.' 
                : searchTerm 
                  ? `No tenants match "${searchTerm}"`
                  : selectedFilter 
                    ? `No tenants found for ${statCards.find(c => c.key === selectedFilter)?.label}`
                    : 'No tenants available.'}
            </p>
            {(searchTerm || selectedFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter(null);
                }}
                className="mt-4 text-sm text-teal-600 hover:text-teal-700 font-semibold transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-5 lg:-mx-6 xl:-mx-7">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Occupant</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Type</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Contact</th>
                  {!selectedFilter && (
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Company</th>
                  )}
                  {selectedFilter === 'private-office' && (
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Company</th>
                  )}
                  {selectedFilter === 'private-office' && (
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Office</th>
                  )}
                  {selectedFilter === 'virtual-office' && (
                    <>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Company</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Position</th>
                    </>
                  )}
                  {selectedFilter === 'dedicated-desk' && (
                    <>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Desk</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Company</th>
                    </>
                  )}
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Start Date</th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredTenants.map((tenant, index) => (
                  <tr 
                    key={`${tenant.type}-${tenant.id}`} 
                    className="bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ animation: `fadeInScale 0.3s ease-out ${index * 0.05}s both` }}
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <div>
                        <p className="text-slate-800 font-semibold text-sm">{tenant.clientName || tenant.name || 'Unnamed Tenant'}</p>
                        <p className="text-gray-500 text-xs mt-0.5 truncate max-w-[200px]" title={tenant.email || 'N/A'}>
                          {tenant.email ? tenant.email : 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getTenantTypeColor(tenant.type)}`}>
                        {getTenantTypeLabel(tenant.type)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-gray-600 text-sm">{tenant.contactNumber || tenant.phone || 'N/A'}</p>
                    </td>
                    {!selectedFilter && (
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-gray-600 text-sm truncate max-w-[150px]" title={tenant.companyName || tenant.company || 'N/A'}>
                          {tenant.companyName || tenant.company ? tenant.companyName || tenant.company : 'N/A'}
                        </p>
                      </td>
                    )}
                    {selectedFilter === 'private-office' && (
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-gray-600 text-sm truncate max-w-[150px]" title={tenant.companyName || 'N/A'}>
                          {tenant.companyName ? tenant.companyName : 'N/A'}
                        </p>
                      </td>
                    )}
                    {selectedFilter === 'private-office' && (
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-gray-600 text-sm font-semibold">{tenant.room || 'N/A'}</p>
                      </td>
                    )}
                    {selectedFilter === 'virtual-office' && (
                      <>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-gray-600 text-sm truncate max-w-[150px]" title={tenant.companyName || 'N/A'}>
                            {tenant.companyName ? tenant.companyName : 'N/A'}
                          </p>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-gray-600 text-sm truncate max-w-[120px]" title={tenant.position || 'N/A'}>
                            {tenant.position || 'N/A'}
                          </p>
                        </td>
                      </>
                    )}
                    {selectedFilter === 'dedicated-desk' && (
                      <>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-gray-600 text-sm font-semibold">{tenant.desk || 'N/A'}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-gray-600 text-sm truncate max-w-[150px]" title={tenant.companyName || 'N/A'}>
                            {tenant.companyName ? tenant.companyName : 'N/A'}
                          </p>
                        </td>
                      </>
                    )}
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-gray-600 text-sm whitespace-nowrap">
                        {tenant.startDate 
                          ? new Date(tenant.startDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })
                          : 'N/A'}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          tenant.status === 'active' || tenant.status === 'ongoing' || tenant.status === 'approved'
                            ? 'bg-teal-100 text-teal-700'
                            : tenant.status === 'pending' || tenant.status === 'upcoming'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
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
    </div>
  );
}
