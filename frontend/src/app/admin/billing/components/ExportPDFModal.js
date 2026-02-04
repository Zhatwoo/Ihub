'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ExportPDFModal({ isOpen, onClose, allClients }) {
  const [mounted, setMounted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Group clients by service type
  const groupedClients = {
    'dedicated-desk': allClients.filter(c => c.serviceType === 'dedicated-desk').sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    'private-office': allClients.filter(c => c.serviceType === 'private-office').sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    'virtual-office': allClients.filter(c => c.serviceType === 'virtual-office').sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  };

  const serviceLabels = {
    'dedicated-desk': 'Dedicated Desk',
    'private-office': 'Private Office',
    'virtual-office': 'Virtual Office'
  };

  // Get filtered clients based on service filter dropdown
  const getFilteredClients = () => {
    if (selectedServiceFilter === 'all') {
      return allClients;
    }
    return groupedClients[selectedServiceFilter] || [];
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const filteredClients = getFilteredClients();
    const allUserIds = filteredClients.map(c => c.userId);
    
    // Check if all filtered users are already selected
    const allSelected = allUserIds.every(id => selectedUsers.includes(id));
    
    if (allSelected) {
      // Deselect all filtered users
      setSelectedUsers(prev => prev.filter(id => !allUserIds.includes(id)));
    } else {
      // Select all filtered users (merge with existing)
      setSelectedUsers(prev => [...new Set([...prev, ...allUserIds])]);
    }
  };

  const handleSelectAllForService = (serviceType) => {
    const serviceUsers = groupedClients[serviceType].map(c => c.userId);
    const allSelected = serviceUsers.every(id => selectedUsers.includes(id));
    
    if (allSelected) {
      // Deselect all users from this service
      setSelectedUsers(prev => prev.filter(id => !serviceUsers.includes(id)));
    } else {
      // Select all users from this service
      setSelectedUsers(prev => [...new Set([...prev, ...serviceUsers])]);
    }
  };

  const isServiceAllSelected = (serviceType) => {
    const serviceUsers = groupedClients[serviceType].map(c => c.userId);
    return serviceUsers.length > 0 && serviceUsers.every(id => selectedUsers.includes(id));
  };

  const handleExport = async () => {
    try {
      const filters = {
        users: selectedUsers.length > 0 ? selectedUsers : 'all',
        status: selectedStatus || 'all',
        service: selectedService || 'all',
        dateFrom,
        dateTo
      };
      
      console.log('Exporting PDF with filters:', filters);

      // Call the export API
      const response = await fetch('/api/admin/billing/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('PDF downloaded successfully');
      
      // Close modal after successful export
      onClose();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleReset = () => {
    setSelectedStatus('');
    setSelectedService('');
    setDateFrom('');
    setDateTo('');
    setSelectedUsers([]);
    setSelectedServiceFilter('all');
  };

  if (!isOpen || !mounted) return null;

  const filteredClients = getFilteredClients();
  const allFilteredSelected = filteredClients.length > 0 && filteredClients.every(c => selectedUsers.includes(c.userId));

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <h2 className="text-2xl font-bold text-slate-800">Export Billing Report (PDF)</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Date Range */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date Range
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
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

            {/* Bill Status and Service Type in one row */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bill Status */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Bill Status
                  </h3>
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

                {/* Service Type */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Service Type
                  </h3>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                  >
                    <option value="">All Services</option>
                    <option value="dedicated-desk">Dedicated Desk</option>
                    <option value="private-office">Private Office</option>
                    <option value="virtual-office">Virtual Office</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Filter */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Users
              </h3>
              
              {/* Service Filter Dropdown */}
              <select
                value={selectedServiceFilter}
                onChange={(e) => setSelectedServiceFilter(e.target.value)}
                className="w-full px-4 py-2.5 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
              >
                <option value="all">All Services</option>
                <option value="dedicated-desk">Dedicated Desk</option>
                <option value="private-office">Private Office</option>
                <option value="virtual-office">Virtual Office</option>
              </select>

              {/* Select All for filtered view */}
              <div className="bg-white rounded-lg p-3 mb-3 border border-gray-300">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-base font-bold text-blue-600">Select All</span>
                </label>
              </div>

              {/* Users List */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {selectedServiceFilter === 'all' ? (
                  // Show grouped by service
                  Object.entries(groupedClients).map(([serviceType, clients]) => (
                    clients.length > 0 && (
                      <div key={serviceType}>
                        {/* Service Header with Select All */}
                        <div className="bg-gray-200 rounded-lg p-3 flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold text-slate-700 uppercase">{serviceLabels[serviceType]}</h4>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isServiceAllSelected(serviceType)}
                              onChange={() => handleSelectAllForService(serviceType)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-xs font-semibold text-slate-600">Select All</span>
                          </label>
                        </div>
                        {/* Users in this service */}
                        <div className="space-y-2 ml-4">
                          {clients.map(client => (
                            <div key={client.userId} className="bg-white rounded-lg p-3 border border-gray-200">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(client.userId)}
                                  onChange={() => handleUserToggle(client.userId)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-slate-800">{client.name || 'Unnamed Client'}</div>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))
                ) : (
                  // Show only selected service
                  <div className="space-y-2">
                    {filteredClients.map(client => (
                      <div key={client.userId} className="bg-white rounded-lg p-3 border border-gray-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(client.userId)}
                            onChange={() => handleUserToggle(client.userId)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-800">{client.name || 'Unnamed Client'}</div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Reset Filters
          </button>
          <div className="text-sm text-gray-600">
            {selectedUsers.length > 0 ? `${selectedUsers.length} user(s)` : 'All users'} • 
            {selectedStatus ? ` Status: ${selectedStatus}` : ' All statuses'} • 
            {selectedService ? ` Service: ${selectedService.replace('-', ' ')}` : ' All services'}
            {(dateFrom || dateTo) && ' • Date range set'}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
