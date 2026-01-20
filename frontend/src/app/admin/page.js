'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';

export default function AdminDashboard() {
  const [rooms, setRooms] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [deskAssignments, setDeskAssignments] = useState([]);
  const [deskRequests, setDeskRequests] = useState([]);
  const [privateOfficeRequests, setPrivateOfficeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [mounted, setMounted] = useState(false);
  const dataIntervalRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data from backend with error handling
        const fetchWithFallback = async (endpoint, fallback = []) => {
          try {
            const response = await api.get(endpoint);
            return response.success ? (response.data || fallback) : fallback;
          } catch (error) {
            console.warn(`Failed to fetch ${endpoint}:`, error);
            return fallback;
          }
        };

        const [
          roomsData, 
          schedulesData, 
          deskAssignmentsData,
          deskRequestsData
        ] = await Promise.all([
          fetchWithFallback('/api/rooms'),
          fetchWithFallback('/api/schedules'),
          fetchWithFallback('/api/desk-assignments'),
          fetchWithFallback('/api/accounts/desk-requests')
        ]);

        setRooms(roomsData);
        setSchedules(schedulesData);
        setDeskAssignments(deskAssignmentsData);
        setDeskRequests(deskRequestsData);

        // For private office requests, we'll use the schedules data for now
        // since they represent booking requests
        setPrivateOfficeRequests(schedulesData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set empty arrays as fallback
        setRooms([]);
        setSchedules([]);
        setDeskAssignments([]);
        setDeskRequests([]);
        setPrivateOfficeRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Poll for updates every 30 seconds
    // Only poll when tab is visible to reduce unnecessary requests
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (dataIntervalRef.current) {
          clearInterval(dataIntervalRef.current);
          dataIntervalRef.current = null;
        }
      } else {
        // Only create interval if one doesn't already exist
        if (!dataIntervalRef.current) {
          fetchData(); // Fetch immediately when tab becomes visible
          dataIntervalRef.current = setInterval(fetchData, 30000);
        }
      }
    };
    
    // Start polling if tab is visible (only if no interval exists)
    if (!document.hidden && !dataIntervalRef.current) {
      dataIntervalRef.current = setInterval(fetchData, 30000);
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
        dataIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Calculate stats for each service
  const privateOfficeStats = {
    totalRooms: rooms.length,
    totalBookings: schedules.length,
    approved: schedules.filter(s => s.status === 'approved' || s.status === 'upcoming' || s.status === 'ongoing' || s.status === 'active' || s.status === 'completed').length,
    rejected: schedules.filter(s => s.status === 'rejected').length,
    pending: schedules.filter(s => s.status === 'pending').length,
    recentBookings: schedules
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
      .slice(0, 5)
  };

  const virtualOfficeStats = {
    totalTenants: deskAssignments.filter(d => d.type === 'Tenant').length,
    totalEmployees: deskAssignments.filter(d => d.type === 'Employee').length,
    recentTenants: deskAssignments
      .filter(d => d.type === 'Tenant')
      .sort((a, b) => new Date(b.assignedAt || 0) - new Date(a.assignedAt || 0))
      .slice(0, 5)
  };

  const dedicatedDeskStats = {
    approved: deskRequests.filter(r => r.status === 'approved').length,
    pending: deskRequests.filter(r => r.status === 'pending').length,
    rejected: deskRequests.filter(r => r.status === 'rejected').length,
    totalAssigned: deskAssignments.length,
    recentRequests: deskRequests
      .sort((a, b) => new Date(b.requestDate || b.createdAt || 0) - new Date(a.requestDate || a.createdAt || 0))
      .slice(0, 5)
  };

  const services = [
    { 
      key: 'private-office',
      label: 'Private Office', 
      value: privateOfficeStats.totalBookings, 
      icon: '🏢', 
      iconBg: 'from-teal-50 to-teal-100', 
      borderColor: 'border-l-teal-600',
      description: 'Meeting rooms & bookings'
    },
    { 
      key: 'virtual-office',
      label: 'Virtual Office', 
      value: virtualOfficeStats.totalTenants, 
      icon: '💼', 
      iconBg: 'from-blue-50 to-blue-100', 
      borderColor: 'border-l-blue-600',
      description: 'Virtual office tenants'
    },
    { 
      key: 'dedicated-desk',
      label: 'Dedicated Desk', 
      value: dedicatedDeskStats.totalAssigned, 
      icon: '🪑', 
      iconBg: 'from-purple-50 to-purple-100', 
      borderColor: 'border-l-purple-600',
      description: 'Desk assignments'
    },
  ];

  const handleServiceClick = (serviceKey) => {
    setSelectedService(serviceKey);
  };

  const closeModal = () => {
    setSelectedService(null);
  };

  const renderServiceModal = () => {
    if (!selectedService || !mounted) return null;

    const modalContent = (() => {
      switch (selectedService) {
        case 'private-office':
          return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease] p-4" onClick={closeModal}>
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-2xl sm:text-3xl text-white shadow-lg">
                      🏢
                    </div>
                    <div>
                      <h2 className="text-slate-800 text-lg sm:text-xl font-bold">Private Office</h2>
                      <p className="text-gray-600 text-sm">Meeting rooms and bookings overview</p>
                    </div>
                  </div>
                  <button 
                    onClick={closeModal} 
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg sm:text-xl hover:bg-gray-200 hover:text-slate-800 transition-all"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 sm:p-5 border border-teal-200 shadow-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-teal-700 mb-1">{privateOfficeStats.totalRooms}</div>
                      <div className="text-sm text-teal-600 font-medium">Total Rooms</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-5 border border-green-200 shadow-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-green-700 mb-1">{privateOfficeStats.approved}</div>
                      <div className="text-sm text-green-600 font-medium">Approved</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 sm:p-5 border border-yellow-200 shadow-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-yellow-700 mb-1">{privateOfficeStats.pending}</div>
                      <div className="text-sm text-yellow-600 font-medium">Pending</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 sm:p-5 border border-red-200 shadow-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-red-700 mb-1">{privateOfficeStats.rejected}</div>
                      <div className="text-sm text-red-600 font-medium">Rejected</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recent Bookings
                    </h4>
                    {privateOfficeStats.recentBookings.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No recent bookings</p>
                        <p className="text-gray-400 text-sm mt-1">Bookings will appear here once created</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {privateOfficeStats.recentBookings.map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                  <span className="text-teal-600 font-bold text-sm">{booking.clientName?.charAt(0) || 'U'}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800">{booking.clientName || 'Unknown Client'}</p>
                                  <p className="text-sm text-gray-600">{booking.room} • {booking.date || booking.startDate || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500 ml-13">
                                <span>⏰ {booking.timeStart} - {booking.timeEnd}</span>
                                <span>👥 {booking.guests || 0} guests</span>
                                {booking.purpose && <span>📝 {booking.purpose}</span>}
                              </div>
                            </div>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize shadow-sm ${
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                              booking.status === 'upcoming' || booking.status === 'active' || booking.status === 'ongoing' ? 'bg-teal-100 text-teal-700 border border-teal-200' :
                              booking.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                              booking.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                              'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>{booking.status === 'upcoming' || booking.status === 'ongoing' ? 'Active' : booking.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );

        case 'virtual-office':
          return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease] p-4" onClick={closeModal}>
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl sm:text-3xl text-white shadow-lg">
                      💼
                    </div>
                    <div>
                      <h2 className="text-slate-800 text-lg sm:text-xl font-bold">Virtual Office</h2>
                      <p className="text-gray-600 text-sm">Virtual office tenants and details</p>
                    </div>
                  </div>
                  <button 
                    onClick={closeModal} 
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg sm:text-xl hover:bg-gray-200 hover:text-slate-800 transition-all"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-5 border border-blue-200 shadow-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-700 mb-1">{virtualOfficeStats.totalTenants}</div>
                      <div className="text-sm text-blue-600 font-medium">Total Tenants</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-gray-700 mb-1">{virtualOfficeStats.totalEmployees}</div>
                      <div className="text-sm text-gray-600 font-medium">Total Employees</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Recent Tenants
                    </h4>
                    {virtualOfficeStats.recentTenants.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No tenants added yet</p>
                        <p className="text-gray-400 text-sm mt-1">Tenants will appear here once assigned</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {virtualOfficeStats.recentTenants.map((tenant) => (
                          <div key={tenant.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-bold text-sm">{tenant.name?.charAt(0) || 'T'}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800">{tenant.name || 'Unknown Tenant'}</p>
                                  <p className="text-sm text-gray-600">{tenant.email || 'No email'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500 ml-13">
                                {tenant.company && <span>🏢 {tenant.company}</span>}
                                {tenant.contactNumber && <span>📞 {tenant.contactNumber}</span>}
                                {tenant.desk && <span>🪑 Desk {tenant.desk}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold border border-blue-200 shadow-sm">
                                {tenant.type || 'Tenant'}
                              </span>
                              {tenant.assignedAt && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Assigned: {new Date(tenant.assignedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );

        case 'dedicated-desk':
          return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease] p-4" onClick={closeModal}>
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-2xl sm:text-3xl text-white shadow-lg">
                      🪑
                    </div>
                    <div>
                      <h2 className="text-slate-800 text-lg sm:text-xl font-bold">Dedicated Desk</h2>
                      <p className="text-gray-600 text-sm">Desk assignments and requests</p>
                    </div>
                  </div>
                  <button 
                    onClick={closeModal} 
                    className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg sm:text-xl hover:bg-gray-200 hover:text-slate-800 transition-all"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 sm:p-5 border border-purple-200 shadow-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">{dedicatedDeskStats.totalAssigned}</div>
                      <div className="text-sm text-purple-600 font-medium">Total Assigned</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-5 border border-green-200 shadow-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-green-700 mb-1">{dedicatedDeskStats.approved}</div>
                      <div className="text-sm text-green-600 font-medium">Approved</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 sm:p-5 border border-yellow-200 shadow-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-yellow-700 mb-1">{dedicatedDeskStats.pending}</div>
                      <div className="text-sm text-yellow-600 font-medium">Pending</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 sm:p-5 border border-red-200 shadow-sm">
                      <div className="text-2xl sm:text-3xl font-bold text-red-700 mb-1">{dedicatedDeskStats.rejected}</div>
                      <div className="text-sm text-red-600 font-medium">Rejected</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Recent Requests
                    </h4>
                    {dedicatedDeskStats.recentRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No recent requests</p>
                        <p className="text-gray-400 text-sm mt-1">Desk requests will appear here once submitted</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dedicatedDeskStats.recentRequests.map((request) => (
                          <div key={request.id || request.userId} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                  <span className="text-purple-600 font-bold text-sm">{request.requestedBy?.name?.charAt(0) || 'U'}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800">{request.requestedBy?.name || 'Unknown User'}</p>
                                  <p className="text-sm text-gray-600">Desk: {request.deskId} • Section: {request.section}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500 ml-13">
                                <span>📍 {request.location}</span>
                                {request.requestedBy?.email && <span>📧 {request.requestedBy.email}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize shadow-sm ${
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                request.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                                request.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                                'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>{request.status}</span>
                              {request.requestDate && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(request.requestDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    })();

    return createPortal(modalContent, document.body);
  };

  if (loading) {
    return (
      <div className="w-full animate-fadeIn">
        <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 animate-slideInLeft">Dashboard</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-fadeIn">
      <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 animate-slideInLeft">Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-6">
        {services.map((service, i) => (
          <div 
            key={service.key} 
            onClick={() => handleServiceClick(service.key)}
            className={`bg-white rounded-xl p-4 sm:p-5 lg:p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-stagger animate-stagger-${i + 1} border-l-[4px] ${service.borderColor}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${service.iconBg} flex items-center justify-center text-2xl sm:text-3xl shadow-md shrink-0`}>
                {service.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">{service.label}</h3>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">{service.value}</span>
              <span className="text-sm text-gray-500 font-medium">
                {service.key === 'private-office' ? 'bookings' : 
                 service.key === 'virtual-office' ? 'tenants' : 'assigned'}
              </span>
            </div>
            <div className="mt-3 flex items-center text-teal-600 text-sm font-medium">
              <span>View details</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-200 shadow-sm animate-slideUp" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
          <h2 className="text-slate-800 text-base sm:text-lg font-bold mb-3 sm:mb-4">System Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Services Active</span>
              <span className="text-slate-800 font-bold">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Total Users</span>
              <span className="text-slate-800 font-bold">{deskAssignments.length + schedules.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-sm">Pending Requests</span>
              <span className="text-slate-800 font-bold">{privateOfficeStats.pending + dedicatedDeskStats.pending}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-200 shadow-sm animate-slideUp" style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}>
          <h2 className="text-slate-800 text-base sm:text-lg font-bold mb-3 sm:mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              onClick={() => handleServiceClick('private-office')}
              className="w-full text-left p-3 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
            >
              <div className="font-medium text-teal-800">Manage Private Offices</div>
              <div className="text-sm text-teal-600">View bookings and requests</div>
            </button>
            <button 
              onClick={() => handleServiceClick('dedicated-desk')}
              className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
            >
              <div className="font-medium text-purple-800">Manage Dedicated Desks</div>
              <div className="text-sm text-purple-600">Review desk assignments</div>
            </button>
            <button 
              onClick={() => handleServiceClick('virtual-office')}
              className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
            >
              <div className="font-medium text-blue-800">Manage Virtual Office</div>
              <div className="text-sm text-blue-600">View tenant details</div>
            </button>
          </div>
        </div>
      </div>

      {renderServiceModal()}
    </div>
  );
}