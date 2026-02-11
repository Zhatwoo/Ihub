'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';

export default function ExportPDFModal({ isOpen, onClose, allClients }) {
  const [mounted, setMounted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filteredBills, setFilteredBills] = useState([]);
  const [selectedBills, setSelectedBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch bills when filters change
  const handleFetchBills = async () => {
    try {
      setLoading(true);
      setFilteredBills([]);
      setSelectedBills([]);

      // Build query parameters
      const params = new URLSearchParams();
      if (selectedUser) params.append('userId', selectedUser);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedServiceType) params.append('serviceType', selectedServiceType);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await api.get(`/api/admin/billing/filter-bills?${params.toString()}`, { skipCache: true });
      
      if (response.success) {
        setFilteredBills(response.data || []);
      } else {
        alert('Failed to fetch bills');
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
      alert('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const handleBillToggle = (billId) => {
    setSelectedBills(prev => 
      prev.includes(billId) 
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBills.length === filteredBills.length) {
      setSelectedBills([]);
    } else {
      setSelectedBills(filteredBills.map(bill => `${bill.userId}-${bill.billId}`));
    }
  };

  const handleExport = async () => {
    if (selectedBills.length === 0) {
      alert('Please select at least one bill to export');
      return;
    }

    try {
      setExporting(true);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/admin/billing/export-selected-bills-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bills: filteredBills.filter(bill => selectedBills.includes(`${bill.userId}-${bill.billId}`))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      
      // Format filename based on selection
      let filename;
      if (selectedBills.length === 1) {
        // Single bill - use client name and date range
        const selectedBill = filteredBills.find(bill => selectedBills.includes(`${bill.userId}-${bill.billId}`));
        if (selectedBill) {
          const formatDateForFilename = (dateValue) => {
            if (!dateValue) return '';
            const date = new Date(dateValue);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          };
          const startDateFormatted = formatDateForFilename(selectedBill.startDate);
          const dueDateFormatted = formatDateForFilename(selectedBill.dueDate);
          const sanitizedClientName = (selectedBill.clientName || 'Client').replace(/[^a-zA-Z0-9\s]/g, '').trim();
          filename = `${sanitizedClientName}, ${startDateFormatted} - ${dueDateFormatted}.pdf`;
        } else {
          filename = `billing-report-${new Date().toISOString().split('T')[0]}.pdf`;
        }
      } else {
        // Multiple bills - use "Selected Bills" and date
        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        filename = `Selected Bills, ${today}.pdf`;
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      onClose();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleReset = () => {
    setSelectedStatus('');
    setSelectedUser('');
    setSelectedServiceType('');
    setDateFrom('');
    setDateTo('');
    setFilteredBills([]);
    setSelectedBills([]);
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'paid': 'bg-green-100 text-green-700',
      'unpaid': 'bg-yellow-100 text-yellow-700',
      'overdue': 'bg-red-100 text-red-700',
      'inactive': 'bg-gray-100 text-gray-700'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-700';
  };

  const getServiceTypeColor = (serviceType) => {
    const colorMap = {
      'dedicated-desk': 'bg-green-100 text-green-700',
      'private-office': 'bg-blue-100 text-blue-700',
      'virtual-office': 'bg-violet-100 text-violet-700'
    };
    return colorMap[serviceType] || 'bg-gray-100 text-gray-700';
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl animate-[slideUp_0.3s_ease] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <h2 className="text-2xl font-bold text-slate-800">Export Bills to PDF</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={selectedBills.length === 0 || exporting}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF ({selectedBills.length})
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-slate-800 hover:bg-gray-100 transition-all shadow-md"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
            {/* Filters */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Filter Bills</h3>
                <div className="flex gap-3">
                  <button
                    onClick={handleFetchBills}
                    disabled={loading}
                    className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Fetching...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Fetch Bills
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* User Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  >
                    <option value="">All Users</option>
                    {allClients.map(client => (
                      <option key={client.userId} value={client.userId}>
                        {client.name} ({client.serviceType})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                  <select
                    value={selectedServiceType}
                    onChange={(e) => setSelectedServiceType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  >
                    <option value="">All Services</option>
                    <option value="dedicated-desk">Dedicated Desk</option>
                    <option value="private-office">Private Office</option>
                    <option value="virtual-office">Virtual Office</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  >
                    <option value="">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="overdue">Overdue</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Bills List */}
            {filteredBills.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Found {filteredBills.length} bill(s)
                  </h3>
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors text-sm"
                  >
                    {selectedBills.length === filteredBills.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1">
                  {filteredBills.map((bill) => {
                    const billKey = `${bill.userId}-${bill.billId}`;
                    const isSelected = selectedBills.includes(billKey);
                    const dueDate = bill.dueDate ? new Date(bill.dueDate) : null;
                    const startDate = bill.startDate ? new Date(bill.startDate) : null;
                    
                    const serviceTypeLabel = bill.serviceType === 'dedicated-desk' ? 'Dedicated Desk' : 
                                            bill.serviceType === 'private-office' ? 'Private Office' : 
                                            bill.serviceType === 'virtual-office' ? 'Virtual Office' : 'N/A';

                    return (
                      <div
                        key={billKey}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                        onClick={() => handleBillToggle(billKey)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleBillToggle(billKey)}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 flex items-center justify-between gap-4">
                            {/* Left side - Client info */}
                            <div className="flex-shrink-0">
                              <p className="font-semibold text-slate-800">{bill.clientName}</p>
                              <p className="text-sm text-gray-600">{bill.assignedResource}</p>
                            </div>
                            
                            {/* Middle - Details in horizontal layout */}
                            <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                              <span className={`text-xs font-medium px-2 py-1 rounded ${getServiceTypeColor(bill.serviceType)}`}>{serviceTypeLabel}</span>
                              <span>Start: {startDate ? startDate.toLocaleDateString() : 'N/A'}</span>
                              <span>Due: {dueDate ? dueDate.toLocaleDateString() : 'N/A'}</span>
                              <span>Period: {bill.feePeriod || 'N/A'}</span>
                            </div>
                            
                            {/* Right side - Amount and status */}
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-bold text-slate-800">
                                ₱{((bill.amount || 0) + (bill.cusaFee || 0) + (bill.parkingFee || 0)).toLocaleString()}
                              </p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(bill.status)}`}>
                                {bill.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!loading && filteredBills.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600 font-semibold">Click "Fetch Bills" to load bills with your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
