'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

// React Icons - Material Design Icons
import { MdBusiness, MdTv, MdDesktopMac } from 'react-icons/md';

// Import modal components
import EditBillModal from './components/EditBillModal';
import PaymentModal from './components/PaymentModal';
import BillsHistoryModal from './components/BillsHistoryModal';
import BillsListModal from './components/BillsListModal';
import BillDetailModal from './components/BillDetailModal';

export default function Billing() {
  const [billingRecords, setBillingRecords] = useState([]);
  const [billingStats, setBillingStats] = useState({ 
    totalBills: 0, 
    totalRevenue: 0, 
    paidCount: 0, 
    unpaidAmount: 0,
    overdueCount: 0 
  });
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [billsModalOpen, setBillsModalOpen] = useState(false);
  const [billsListModalOpen, setBillsListModalOpen] = useState(false);
  const [billDetailModalOpen, setBillDetailModalOpen] = useState(false);
  const [selectedBillForDetail, setSelectedBillForDetail] = useState(null);

  // Fetch billing data
  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        
        // Fetch all billing records
        const recordsResponse = await api.get('/api/admin/billing/all', { skipCache: true });
        if (recordsResponse.success) {
          setBillingRecords(recordsResponse.data || []);
        }

        // Fetch billing statistics
        const statsResponse = await api.get('/api/admin/billing/stats', { skipCache: true });
        if (statsResponse.success) {
          setBillingStats(statsResponse.data || {
            totalBills: 0,
            totalRevenue: 0,
            paidCount: 0,
            unpaidAmount: 0,
            overdueCount: 0
          });
        }
      } catch (error) {
        console.error('Error fetching billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  // Filter and sort billing records
  const filteredBilling = billingRecords
    .filter(record => {
      // Service type filter
      if (selectedServiceType && record.serviceType !== selectedServiceType) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          (record.name && record.name.toLowerCase().includes(searchLower)) ||
          (record.email && record.email.toLowerCase().includes(searchLower)) ||
          (record.phone && record.phone.toLowerCase().includes(searchLower)) ||
          (record.companyName && record.companyName.toLowerCase().includes(searchLower)) ||
          (record.assignedResource && record.assignedResource.toLowerCase().includes(searchLower))
        );
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'email') {
        comparison = (a.email || '').localeCompare(b.email || '');
      } else if (sortBy === 'company') {
        comparison = (a.companyName || '').localeCompare(b.companyName || '');
      } else if (sortBy === 'dueDate') {
        comparison = new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      } else if (sortBy === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  // Get status badge color
  const getStatusColor = (status) => {
    const colorMap = {
      'paid': 'bg-green-100 text-green-700',
      'unpaid': 'bg-yellow-100 text-yellow-700',
      'overdue': 'bg-red-100 text-red-700'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  // Get service type label
  const getServiceTypeLabel = (type) => {
    const typeMap = {
      'private-office': 'Private Office',
      'virtual-office': 'Virtual Office',
      'dedicated-desk': 'Dedicated Desk'
    };
    return typeMap[type] || type;
  };

  // Get service type color
  const getServiceTypeColor = (type) => {
    const colorMap = {
      'private-office': 'bg-blue-100 text-blue-700',
      'virtual-office': 'bg-indigo-100 text-indigo-700',
      'dedicated-desk': 'bg-teal-100 text-teal-700'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-700';
  };

  // Handle Edit button click
  const handleEditClick = (record) => {
    setSelectedBill(record);
    setEditModalOpen(true);
  };

  // Handle Pay button click
  const handlePayClick = (record) => {
    setSelectedBill(record);
    setPayModalOpen(true);
  };

  // Handle Bills button click
  const handleBillsClick = (record) => {
    setSelectedBill(record);
    setBillsListModalOpen(true);
  };

  // Handle bill detail click
  const handleBillDetailClick = (bill) => {
    setSelectedBillForDetail(bill);
    setBillDetailModalOpen(true);
  };

  // Refresh billing data after changes
  const refreshBillingData = async () => {
    try {
      setLoading(true);
      
      const recordsResponse = await api.get('/api/admin/billing/all', { skipCache: true });
      if (recordsResponse.success) {
        setBillingRecords(recordsResponse.data || []);
      }

      const statsResponse = await api.get('/api/admin/billing/stats', { skipCache: true });
      if (statsResponse.success) {
        setBillingStats(statsResponse.data || {
          totalBills: 0,
          totalRevenue: 0,
          paidCount: 0,
          unpaidAmount: 0,
          overdueCount: 0
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

        {/* Paid Bills Card */}
        <div className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-gray-200 shadow-sm hover:shadow-md transition-all" style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm">✅</div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-xs sm:text-sm truncate">Paid Bills</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 truncate">{billingStats.paidCount}</p>
          </div>
        </div>

        {/* Outstanding Amount Card */}
        <div className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-gray-200 shadow-sm hover:shadow-md transition-all" style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm">⏳</div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-500 text-xs sm:text-sm truncate">Outstanding</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 truncate">₱{(billingStats.unpaidAmount || 0).toLocaleString()}</p>
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
                <option value="company">Sort by Company</option>
                <option value="dueDate">Sort by Due Date</option>
                <option value="status">Sort by Status</option>
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
              {billingRecords.length === 0 
                ? 'No billing records have been added yet.' 
                : 'No records match your search criteria.'}
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
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Service Type</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Assigned</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Company</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Amount</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Due Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredBilling.map((record, index) => (
                  <tr 
                    key={`${record.userId}-${record.billId}`} 
                    className="bg-white hover:bg-gray-50 transition-colors"
                    style={{ animation: `fadeInScale 0.3s ease-out ${index * 0.05}s both` }}
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <div>
                        <p className="text-slate-800 font-semibold text-sm">{record.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5 truncate max-w-[200px]" title={record.email}>
                          {record.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        {record.serviceType === 'private-office' && <MdBusiness className="w-5 h-5 text-blue-600" />}
                        {record.serviceType === 'virtual-office' && <MdTv className="w-5 h-5 text-indigo-600" />}
                        {record.serviceType === 'dedicated-desk' && <MdDesktopMac className="w-5 h-5 text-teal-600" />}
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getServiceTypeColor(record.serviceType)}`}>
                          {getServiceTypeLabel(record.serviceType)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-gray-600 text-sm font-semibold">{record.assignedResource}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-gray-600 text-sm truncate max-w-[150px]" title={record.companyName}>
                        {record.companyName}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-gray-600 text-sm font-semibold">
                        ₱{((record.amount || 0) + (record.cusaFee || 0) + (record.parkingFee || 0)).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <p className="text-gray-600 text-sm whitespace-nowrap">
                        {record.dueDate 
                          ? new Date(record.dueDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })
                          : 'N/A'}
                      </p>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(record)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                          title="Edit bill"
                        >
                          Edit
                        </button>
                        {(record.status === 'unpaid' || record.status === 'overdue') && !record.allBillsPaid && (
                          <button
                            onClick={() => handlePayClick(record)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors"
                            title="Record payment"
                          >
                            Pay
                          </button>
                        )}
                        {record.allBillsPaid && (
                          <button
                            disabled
                            className="px-3 py-1.5 bg-green-300 text-white text-xs font-semibold rounded-lg cursor-not-allowed opacity-50"
                            title="All bills paid"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => handleBillsClick(record)}
                          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-colors"
                          title="View all bills"
                        >
                          Bills
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

      {/* Modals */}
      <EditBillModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        bill={selectedBill}
        onSave={refreshBillingData}
      />

      <PaymentModal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        bill={selectedBill}
        onPaymentRecorded={refreshBillingData}
      />

      <BillsListModal
        isOpen={billsListModalOpen}
        onClose={() => setBillsListModalOpen(false)}
        bill={selectedBill}
        onBillClick={handleBillDetailClick}
      />

      <BillDetailModal
        isOpen={billDetailModalOpen}
        onClose={() => setBillDetailModalOpen(false)}
        bill={selectedBillForDetail}
      />

    </div>
  );
}
