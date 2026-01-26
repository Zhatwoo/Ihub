'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '@/lib/api';

// React Icons - Material Design Icons
import { MdBusiness, MdTv, MdDesktopMac } from 'react-icons/md';

// Import the edit modals
import EditPrivateOfficeModal from './components/EditPrivateOfficeModal';
import EditDedicatedDeskVirtualOfficeModal from './components/EditDedicatedDeskVirtualOfficeModal';
import PaymentModal from './components/PaymentModal';

export default function Billing() {
  const [privateOfficeBilling, setPrivateOfficeBilling] = useState([]);
  const [virtualOfficeBilling, setVirtualOfficeBilling] = useState([]);
  const [dedicatedDeskBilling, setDedicatedDeskBilling] = useState([]);
  const [stats, setStats] = useState({ privateOffice: 0, virtualOffice: 0, dedicatedDesk: 0, total: 0 });
  const [billingStats, setBillingStats] = useState({ totalBills: 0, totalRevenue: 0, collected: 0, outstanding: 0 });
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBillingId, setSelectedBillingId] = useState(null);
  const [selectedBillingServiceType, setSelectedBillingServiceType] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentData, setSelectedPaymentData] = useState(null);
  const billingIntervalRef = useRef(null);

  // Fetch all billing data from backend
  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setLoading(true);
        // Fetch processed billing data from admin API - skip cache to get fresh data
        const response = await api.get('/api/admin/billing/stats', { skipCache: true });
        
        if (response.success && response.data) {
          const { stats, billing } = response.data;
          
          // Set processed billing data from backend
          setPrivateOfficeBilling(billing.privateOffice || []);
          setVirtualOfficeBilling(billing.virtualOffice || []);
          setDedicatedDeskBilling(billing.dedicatedDesk || []);
          setStats(stats);
          
          // Calculate billing stats
          const allBillingRecords = [...(billing.privateOffice || []), ...(billing.virtualOffice || []), ...(billing.dedicatedDesk || [])];
          const totalBills = allBillingRecords.length;
          const totalRevenue = allBillingRecords
            .filter(r => r.paymentStatus === 'paid')
            .reduce((sum, record) => sum + (record.amount || 0), 0);
          const collected = allBillingRecords.filter(r => r.paymentStatus === 'paid').length;
          const outstanding = allBillingRecords
            .filter(r => r.paymentStatus !== 'paid')
            .reduce((sum, record) => sum + (record.amount || 0), 0);
          
          setBillingStats({
            totalBills,
            totalRevenue,
            collected,
            outstanding
          });
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
        // Set empty fallbacks
        setPrivateOfficeBilling([]);
        setVirtualOfficeBilling([]);
        setDedicatedDeskBilling([]);
        setStats({ privateOffice: 0, virtualOffice: 0, dedicatedDesk: 0, total: 0 });
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch only - AUTO REFRESH DISABLED
    fetchBilling();
    
    // DISABLED: Auto refresh/polling - was causing excessive Firestore reads
    // Data will only load once on mount, no automatic refresh
    
    return () => {
      if (billingIntervalRef.current) {
        clearInterval(billingIntervalRef.current);
        billingIntervalRef.current = null;
      }
    };
  }, []);

  // Combine all billing records - memoized to prevent infinite loops
  const allBilling = useMemo(() => [...privateOfficeBilling, ...virtualOfficeBilling, ...dedicatedDeskBilling], [privateOfficeBilling, virtualOfficeBilling, dedicatedDeskBilling]);

  // Calculate counts for each type
  const getCountByType = (type) => {
    if (type === 'private-office') return privateOfficeBilling.length;
    if (type === 'virtual-office') return virtualOfficeBilling.length;
    if (type === 'dedicated-desk') return dedicatedDeskBilling.length;
    return allBilling.length;
  };

  // Filter and sort billing records CLIENT-SIDE to avoid excessive API calls - memoized
  const filteredBilling = useMemo(() => {
    let filtered = [...allBilling];

    // Apply service type filter
    if (selectedServiceType) {
      filtered = filtered.filter(record => record.type === selectedServiceType);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        (record.name && record.name.toLowerCase().includes(searchLower)) ||
        (record.email && record.email.toLowerCase().includes(searchLower)) ||
        (record.company && record.company.toLowerCase().includes(searchLower)) ||
        (record.phone && record.phone.toLowerCase().includes(searchLower)) ||
        (record.office && record.office.toLowerCase().includes(searchLower)) ||
        (record.desk && record.desk.toLowerCase().includes(searchLower))
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
  }, [allBilling, selectedServiceType, searchTerm, sortBy, sortOrder]);

  // Get billing type label
  const getBillingTypeLabel = (type) => {
    const typeMap = {
      'private-office': 'Private Office',
      'virtual-office': 'Virtual Office',
      'dedicated-desk': 'Dedicated Desk'
    };
    return typeMap[type] || type;
  };

  // Get billing type color
  const getBillingTypeColor = (type) => {
    const colorMap = {
      'private-office': 'bg-blue-100 text-blue-700',
      'virtual-office': 'bg-indigo-100 text-indigo-700',
      'dedicated-desk': 'bg-teal-100 text-teal-700'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-700';
  };

  // Handle edit button click
  const handleEditClick = (billingId, serviceType) => {
    setSelectedBillingId(billingId);
    setSelectedBillingServiceType(serviceType);
    setEditModalOpen(true);
  };

  // Handle edit modal save
  const handleEditSave = async () => {
    // Refresh billing data after save
    try {
      setLoading(true);
      const response = await api.get('/api/admin/billing/stats', { skipCache: true });
      
      if (response.success && response.data) {
        const { stats, billing } = response.data;
        
        setPrivateOfficeBilling(billing.privateOffice || []);
        setVirtualOfficeBilling(billing.virtualOffice || []);
        setDedicatedDeskBilling(billing.dedicatedDesk || []);
        setStats(stats);
        
        const allBillingRecords = [...(billing.privateOffice || []), ...(billing.virtualOffice || []), ...(billing.dedicatedDesk || [])];
        const totalBills = allBillingRecords.length;
        const totalRevenue = allBillingRecords
          .filter(r => r.paymentStatus === 'paid')
          .reduce((sum, record) => sum + (record.amount || 0), 0);
        const collected = allBillingRecords.filter(r => r.paymentStatus === 'paid').length;
        const outstanding = allBillingRecords
          .filter(r => r.paymentStatus !== 'paid')
          .reduce((sum, record) => sum + (record.amount || 0), 0);
        
        setBillingStats({
          totalBills,
          totalRevenue,
          collected,
          outstanding
        });
      }
    } catch (error) {
      console.error('Error refreshing billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full animate-fadeIn">
      <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 animate-slideInLeft">Billing</h1>
      
      {/* Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6">
        {/* Total Bills Card */}
        <div className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-gray-200 shadow-sm hover:shadow-md transition-all" style={{ animation: 'slideUp 0.5s ease-out 0s both' }}>
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm">📋</div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-xs sm:text-sm truncate">Total Bills</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 truncate">{billingStats.totalBills}</p>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-gray-200 shadow-sm hover:shadow-md transition-all" style={{ animation: 'slideUp 0.5s ease-out 0.1s both' }}>
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm">💰</div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-xs sm:text-sm truncate">Total Revenue</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 truncate">₱{(billingStats.totalRevenue || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Collected Card */}
        <div className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-gray-200 shadow-sm hover:shadow-md transition-all" style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm">✅</div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-xs sm:text-sm truncate">Collected</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 truncate">{billingStats.collected}</p>
          </div>
        </div>

        {/* Outstanding Card */}
        <div className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-gray-200 shadow-sm hover:shadow-md transition-all" style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm">⏳</div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-xs sm:text-sm truncate">Outstanding</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 truncate">₱{(billingStats.outstanding || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* All Billing Records List Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 xl:p-7 shadow-lg shadow-slate-800/5 border border-gray-200" style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
        <div className="mb-4 sm:mb-5 lg:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            {selectedServiceType 
              ? `${selectedServiceType === 'private-office' ? 'Private Office' : selectedServiceType === 'virtual-office' ? 'Virtual Office' : 'Dedicated Desk'} Billing`
              : 'All Billing'}
          </h2>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            <div className="flex-1 sm:flex-none relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search by name, email, phone, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              <select
                value={selectedServiceType || ''}
                onChange={(e) => setSelectedServiceType(e.target.value || null)}
                className="flex-1 sm:flex-none px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
              >
                <option value="">All Services</option>
                <option value="dedicated-desk">Dedicated Desk</option>
                <option value="private-office">Private Office</option>
                <option value="virtual-office">Virtual Office</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
              >
                <option value="name">Sort by Name</option>
                {selectedServiceType === 'private-office' && <option value="office">Sort by Office</option>}
                {selectedServiceType === 'private-office' && <option value="company">Sort by Company</option>}
                {selectedServiceType === 'dedicated-desk' && <option value="desk">Sort by Desk</option>}
                {selectedServiceType === 'dedicated-desk' && <option value="company">Sort by Company</option>}
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
            <p className="text-gray-500">Loading billing records...</p>
          </div>
        ) : filteredBilling.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">💳</div>
            <p className="text-gray-500 text-lg mb-2 font-semibold">No billing records found</p>
            <p className="text-gray-400 text-sm">
              {allBilling.length === 0 
                ? 'No billing records have been added yet.' 
                : searchTerm 
                  ? `No records match "${searchTerm}"`
                  : selectedServiceType 
                    ? `No records found for ${selectedServiceType === 'private-office' ? 'Private Office' : selectedServiceType === 'virtual-office' ? 'Virtual Office' : 'Dedicated Desk'}`
                    : 'No billing records available.'}
            </p>
            {(searchTerm || selectedServiceType) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedServiceType(null);
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
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Client</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Type</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Contact</th>
                  {!selectedServiceType && (
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Company</th>
                  )}
                  {selectedServiceType === 'private-office' && (
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Company</th>
                  )}
                  {selectedServiceType === 'private-office' && (
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Office</th>
                  )}
                  {selectedServiceType === 'virtual-office' && (
                    <>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Company</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Position</th>
                    </>
                  )}
                  {selectedServiceType === 'dedicated-desk' && (
                    <>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Desk</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Company</th>
                    </>
                  )}
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Start Date</th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredBilling.map((record, index) => (
                  <tr 
                    key={`${record.type}-${record.id}`} 
                    className="bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ animation: `fadeInScale 0.3s ease-out ${index * 0.05}s both` }}
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <div>
                        <p className="text-slate-800 font-semibold text-sm">{record.clientName || record.name || 'Unnamed Client'}</p>
                        <p className="text-gray-500 text-xs mt-0.5 truncate max-w-[200px]" title={record.email || 'N/A'}>
                          {record.email ? record.email : 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        {record.type === 'private-office' && <MdBusiness className="w-5 h-5 text-blue-600" />}
                        {record.type === 'virtual-office' && <MdTv className="w-5 h-5 text-indigo-600" />}
                        {record.type === 'dedicated-desk' && <MdDesktopMac className="w-5 h-5 text-teal-600" />}
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getBillingTypeColor(record.type)}`}>
                          {getBillingTypeLabel(record.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-gray-600 text-sm">{record.contactNumber || record.phone || 'N/A'}</p>
                    </td>
                    {!selectedServiceType && (
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-gray-600 text-sm truncate max-w-[150px]" title={record.companyName || record.company || 'N/A'}>
                          {record.companyName || record.company ? record.companyName || record.company : 'N/A'}
                        </p>
                      </td>
                    )}
                    {selectedServiceType === 'private-office' && (
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-gray-600 text-sm truncate max-w-[150px]" title={record.companyName || 'N/A'}>
                          {record.companyName ? record.companyName : 'N/A'}
                        </p>
                      </td>
                    )}
                    {selectedServiceType === 'private-office' && (
                      <td className="px-4 sm:px-6 py-4">
                        <p className="text-gray-600 text-sm font-semibold">{record.room || 'N/A'}</p>
                      </td>
                    )}
                    {selectedServiceType === 'virtual-office' && (
                      <>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-gray-600 text-sm truncate max-w-[150px]" title={record.companyName || 'N/A'}>
                            {record.companyName ? record.companyName : 'N/A'}
                          </p>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-gray-600 text-sm truncate max-w-[120px]" title={record.position || 'N/A'}>
                            {record.position || 'N/A'}
                          </p>
                        </td>
                      </>
                    )}
                    {selectedServiceType === 'dedicated-desk' && (
                      <>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-gray-600 text-sm font-semibold">{record.desk || 'N/A'}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-gray-600 text-sm truncate max-w-[150px]" title={record.companyName || 'N/A'}>
                            {record.companyName ? record.companyName : 'N/A'}
                          </p>
                        </td>
                      </>
                    )}
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-gray-600 text-sm whitespace-nowrap">
                        {record.startDate 
                          ? new Date(record.startDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })
                          : 'N/A'}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button 
                          onClick={() => {
                            setSelectedBillingId(record.id);
                            setSelectedBillingServiceType(record.type);
                            if (record.userId) {
                              sessionStorage.setItem(`billing_userId_${record.id}`, record.userId);
                            }
                            setEditModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors whitespace-nowrap"
                          title="Edit billing information"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => setSelectedPaymentData(record)}
                          className="px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
                          title="Process payment"
                        >
                          Pay
                        </button>
                        <button 
                          className="px-2.5 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-semibold hover:bg-gray-700 transition-colors whitespace-nowrap"
                          title="View payment history"
                        >
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Billing Modals */}
      {selectedBillingServiceType === 'private-office' ? (
        <EditPrivateOfficeModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          billingId={selectedBillingId}
          onSave={handleEditSave}
        />
      ) : (
        <EditDedicatedDeskVirtualOfficeModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          billingId={selectedBillingId}
          serviceType={selectedBillingServiceType}
          onSave={handleEditSave}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={selectedPaymentData !== null}
        onClose={() => setSelectedPaymentData(null)}
        billingData={selectedPaymentData}
        onPaymentRecorded={handleEditSave}
      />
    </div>
  );
}
