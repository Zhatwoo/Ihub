'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function Tenants() {
  const [privateOfficeTenants, setPrivateOfficeTenants] = useState([]);
  const [virtualOfficeTenants, setVirtualOfficeTenants] = useState([]);
  const [dedicatedDeskTenants, setDedicatedDeskTenants] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);

  // Fetch all tenant data from backend
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        // Fetch all data in parallel
        const [schedulesResponse, virtualOfficeResponse, deskAssignmentsResponse] = await Promise.all([
          api.get('/api/schedules'),
          api.get('/api/virtual-office'),
          api.get('/api/desk-assignments')
        ]);

        // Process Private Office tenants
        if (schedulesResponse.success && schedulesResponse.data) {
          const activeTenants = schedulesResponse.data
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
        }

        // Process Virtual Office tenants
        if (virtualOfficeResponse.success && virtualOfficeResponse.data) {
          const confirmedTenants = virtualOfficeResponse.data
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
        }

        // Process Dedicated Desk tenants
        if (deskAssignmentsResponse.success && deskAssignmentsResponse.data) {
          const deskTenants = deskAssignmentsResponse.data.map(assignment => ({
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
        }
      } catch (error) {
        console.error('Error fetching tenants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchTenants, 30000);
    return () => clearInterval(interval);
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

  // Filter and sort tenants
  const getFilteredAndSortedTenants = () => {
    let tenants = selectedFilter ? getTenantsByType(selectedFilter) : allTenants;
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      tenants = tenants.filter(tenant => 
        (tenant.name && tenant.name.toLowerCase().includes(search)) ||
        (tenant.email && tenant.email.toLowerCase().includes(search)) ||
        (tenant.phone && tenant.phone.toLowerCase().includes(search)) ||
        (tenant.company && tenant.company.toLowerCase().includes(search)) ||
        (tenant.office && tenant.office.toLowerCase().includes(search)) ||
        (tenant.desk && tenant.desk.toLowerCase().includes(search))
      );
    }
    
    // Apply sorting
    tenants.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.startDate || a.createdAt || 0);
          bValue = new Date(b.startDate || b.createdAt || 0);
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    return tenants;
  };

  const filteredTenants = getFilteredAndSortedTenants();

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
        {statCards.map((card, index) => (
          <div 
            key={card.key} 
            onClick={() => setSelectedFilter(selectedFilter === card.key ? null : card.key)} 
            className={`bg-white rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 border border-gray-200 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-800/10 border-l-[3px] sm:border-l-[4px] ${card.color} ${selectedFilter === card.key ? `ring-2 ${card.ring} -translate-y-0.5 shadow-xl` : 'shadow-sm'} animate-stagger`}
            style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'backwards' }}
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

      {/* All Tenants List Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 xl:p-7 shadow-lg shadow-slate-800/5 border border-gray-200 animate-slideUp">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 lg:mb-6 gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
              {selectedFilter 
                ? `${statCards.find(c => c.key === selectedFilter)?.label} Tenants`
                : 'All Tenants'}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedFilter 
                ? `Showing ${filteredTenants.length} of ${getCountByType(selectedFilter)} tenants`
                : `Total: ${allTenants.length} tenants`}
            </p>
          </div>
          {selectedFilter && (
            <button 
              onClick={() => setSelectedFilter(null)}
              className="text-sm text-teal-600 hover:text-teal-700 font-semibold transition-colors px-4 py-2 border border-teal-200 rounded-lg hover:bg-teal-50"
            >
              Show All
            </button>
          )}
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-5">
          <div className="flex-1 relative">
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
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="type">Sort by Type</option>
              <option value="status">Sort by Status</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:border-teal-600 transition-all"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
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
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Tenant</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Type</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Contact</th>
                  {!selectedFilter && (
                    <>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Office/Desk</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Company</th>
                    </>
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
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Type</th>
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
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <div>
                        <p className="text-slate-800 font-semibold text-sm">{tenant.name || 'Unnamed Tenant'}</p>
                        <p className="text-gray-500 text-xs mt-0.5 truncate max-w-[200px]" title={tenant.email || 'N/A'}>
                          {tenant.email || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getTenantTypeColor(tenant.type)}`}>
                        {getTenantTypeLabel(tenant.type)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-gray-600 text-sm">{tenant.phone || 'N/A'}</p>
                    </td>
                    {!selectedFilter && (
                      <>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-gray-600 text-sm font-medium">
                            {tenant.office || tenant.desk || 'N/A'}
                          </p>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-gray-600 text-sm truncate max-w-[150px]" title={tenant.company || 'N/A'}>
                            {tenant.company || 'N/A'}
                          </p>
                        </td>
                      </>
                    )}
                    {selectedFilter === 'private-office' && (
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-gray-600 text-sm font-medium">{tenant.office || 'N/A'}</p>
                      </td>
                    )}
                    {selectedFilter === 'virtual-office' && (
                      <>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-gray-600 text-sm truncate max-w-[150px]" title={tenant.company || 'N/A'}>
                            {tenant.company || 'N/A'}
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
                          <p className="text-gray-600 text-sm capitalize">{tenant.occupantType || 'N/A'}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-gray-600 text-sm truncate max-w-[150px]" title={tenant.company || 'N/A'}>
                            {tenant.company || 'N/A'}
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
        
        {/* Summary Footer */}
        {filteredTenants.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600">
            <p>
              Showing <span className="font-semibold text-slate-800">{filteredTenants.length}</span> tenant{filteredTenants.length !== 1 ? 's' : ''}
              {selectedFilter && ` (${getCountByType(selectedFilter)} total)`}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                <span>Active</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span>Pending</span>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
