'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';

// React Icons - Material Design Icons
import { MdBusiness, MdTv, MdDesktopMac } from 'react-icons/md';

export default function AdminDashboard() {
  // UI State
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const dataIntervalRef = useRef(null);
  
  // Data State
  const [privateOfficeStats, setPrivateOfficeStats] = useState({});
  const [virtualOfficeStats, setVirtualOfficeStats] = useState({});
  const [dedicatedDeskStats, setDedicatedDeskStats] = useState({});
  const [billingStats, setBillingStats] = useState({ totalRevenue: 0, unpaidCount: 0, unpaidAmount: 0, inactiveCount: 0 }); // Add billing stats
  const [rooms, setRooms] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [rawData, setRawData] = useState({}); // Add rawData state
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDetailView, setSelectedDetailView] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null); // For pie chart hover

  // Mount state for portals
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dashboard data from backend (all processing done server-side)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/api/admin/dashboard/stats');
        
        if (response.success) {
          const { privateOffice, virtualOffice, dedicatedDesk, rawData } = response.data;
          
          // Set processed stats from backend
          setPrivateOfficeStats(privateOffice);
          setVirtualOfficeStats(virtualOffice);
          setDedicatedDeskStats(dedicatedDesk);
          
          // Set raw data for modals
          setRawData(rawData || {});
          
          // Set limited raw data for modals (backward compatibility)
          setRooms(rawData.rooms || []);
          setSchedules(rawData.schedules || []);
        }

        // Fetch billing stats
        const billingResponse = await api.get('/api/admin/billing/stats');
        if (billingResponse.success) {
          setBillingStats(billingResponse.data || { totalRevenue: 0, unpaidCount: 0, unpaidAmount: 0, inactiveCount: 0 });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set empty fallbacks
        setPrivateOfficeStats({});
        setVirtualOfficeStats({});
        setDedicatedDeskStats({});
        setBillingStats({ totalRevenue: 0, unpaidCount: 0, unpaidAmount: 0, inactiveCount: 0 });
        setRawData({});
        setRooms([]);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch only - AUTO REFRESH DISABLED
    fetchData();
    
    // DISABLED: Auto refresh/polling - was causing excessive Firestore reads
    // Data will only load once on mount, no automatic refresh
    // const handleVisibilityChange = () => { ... };
    // document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
        dataIntervalRef.current = null;
      }
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Service configuration (UI only)
  const services = [
    { 
      key: 'private-office',
      label: 'Private Office', 
      value: privateOfficeStats.totalBookings || 0, 
      icon: MdBusiness, 
      iconBg: 'from-teal-50 to-teal-100', 
      borderColor: 'border-l-teal-600',
      description: 'Meeting rooms & bookings',
      extraStats: {
        offices: privateOfficeStats.totalRooms || 0,
        tenants: privateOfficeStats.totalTenants || 0
      }
    },
    { 
      key: 'virtual-office',
      label: 'Virtual Office', 
      value: virtualOfficeStats.totalClients || 0, 
      icon: MdTv, 
      iconBg: 'from-blue-50 to-blue-100', 
      borderColor: 'border-l-blue-600',
      description: 'Virtual office tenants'
    },
    { 
      key: 'dedicated-desk',
      label: 'Dedicated Desk', 
      value: `${dedicatedDeskStats.occupiedSeats || 0}/${dedicatedDeskStats.totalSeats || 267}`, 
      icon: MdDesktopMac, 
      iconBg: 'from-purple-50 to-purple-100', 
      borderColor: 'border-l-purple-600',
      description: 'Desk assignments',
      extraStats: {
        tenants: dedicatedDeskStats.tenantCount || 0,
        employees: dedicatedDeskStats.employeeCount || 0
      }
    }
  ];

  // UI Helper functions
  const closeModal = () => {
    setSelectedService(null);
    setSelectedDetailView(null);
  };

  // Render active shape for pie chart hover effect (zoom only, no text)
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ 
            transition: 'all 0.3s ease-out',
            transformOrigin: 'center'
          }}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 15}
          fill={fill}
          style={{ 
            transition: 'all 0.3s ease-out',
            transformOrigin: 'center'
          }}
        />
      </g>
    );
  };

  // Helper function to darken colors (noticeably darker but not black)
  const darkenColor = (color) => {
    const colorMap = {
      '#10b981': '#067a4a', // green to darker green
      '#8b5cf6': '#5b2fb8', // violet to darker violet
      '#3b82f6': '#1d4ed8'  // blue to darker blue
    };
    return colorMap[color] || color;
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const openServiceModal = (serviceKey) => {
    setSelectedService(serviceKey);
    // Auto-select default views for each service
    if (serviceKey === 'private-office') {
      setSelectedDetailView('bookings'); // Auto-open Recent Bookings
    } else if (serviceKey === 'virtual-office') {
      setSelectedDetailView('tenants'); // Auto-open Tenants
    } else {
      setSelectedDetailView(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      active: 'bg-green-100 text-green-700',
      upcoming: 'bg-teal-100 text-teal-700',
      ongoing: 'bg-blue-100 text-blue-700',
      completed: 'bg-gray-100 text-gray-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    
    return statusConfig[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of all services and activities</p>
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {services.map((service, index) => {
          const IconComponent = service.icon;
          return (
          <div
            key={service.key}
            onClick={() => openServiceModal(service.key)}
            className={`bg-white rounded-2xl p-4 sm:p-6 border-l-4 ${service.borderColor} shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 animate-[slideUp_0.4s_ease] group`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {service.extraStats && (service.extraStats.tenants !== undefined || service.extraStats.employees !== undefined) && service.extraStats.offices === undefined ? (
              // Dedicated Desk: Show only Desks Occupied on top right
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{service.label}</h3>
                    <p className="text-gray-500 text-sm">{service.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold text-slate-800">{service.value}</span>
                  <span className="text-xs text-gray-600 whitespace-nowrap">Desks Occupied</span>
                </div>
              </div>
            ) : service.extraStats && service.extraStats.offices !== undefined ? (
              // Private Office: Show only total bookings on top right
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{service.label}</h3>
                    <p className="text-gray-500 text-sm">{service.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold text-slate-800">{service.value}</span>
                  <span className="text-xs text-gray-600 whitespace-nowrap">Total Bookings</span>
                </div>
              </div>
            ) : (
              // Virtual Office and other services: Number on top right with label below
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{service.label}</h3>
                    <p className="text-gray-500 text-sm">{service.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold text-slate-800">{service.value}</span>
                  <span className="text-xs text-gray-600">Tenants</span>
                </div>
              </div>
            )}
          </div>
        );
        })}
      </div>

      {/* Dashboard Cards Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-6">
        {/* Tenant Distribution Card */}
        <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-lg animate-fadeIn opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <h2 className="text-base xl:text-xl font-bold text-slate-800 mb-3 xl:mb-4">Tenant Distribution</h2>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-3 xl:gap-4">
            <div className="w-full max-w-[180px] xl:max-w-[220px] aspect-square">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { 
                        name: 'Dedicated Desk', 
                        value: dedicatedDeskStats.tenantCount || 0,
                        color: '#10b981' // green
                      },
                      { 
                        name: 'Virtual Office', 
                        value: virtualOfficeStats.totalClients || 0,
                        color: '#8b5cf6' // violet
                      },
                      { 
                        name: 'Private Office', 
                        value: privateOfficeStats.totalTenants || 0,
                        color: '#3b82f6' // blue
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius="80%"
                    fill="#8884d8"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    animationBegin={0}
                    animationDuration={300}
                    animationEasing="ease-out"
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    isAnimationActive={true}
                  >
                    {[
                      { color: '#10b981' },
                      { color: '#8b5cf6' },
                      { color: '#3b82f6' }
                    ].map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={activeIndex !== null && activeIndex !== index ? darkenColor(entry.color) : entry.color}
                        style={{ transition: 'fill 0.3s ease' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => {
                      const total = (dedicatedDeskStats.tenantCount || 0) + (virtualOfficeStats.totalClients || 0) + (privateOfficeStats.totalTenants || 0);
                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                      return [`${value} tenants (${percent}%)`, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-col gap-2 xl:gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 xl:w-3 xl:h-3 rounded-sm bg-green-500 flex-shrink-0"></div>
                <span className="text-slate-700 text-xs xl:text-sm font-medium">Dedicated Desk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 xl:w-3 xl:h-3 rounded-sm bg-violet-500 flex-shrink-0"></div>
                <span className="text-slate-700 text-xs xl:text-sm font-medium">Virtual Office</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 xl:w-3 xl:h-3 rounded-sm bg-blue-500 flex-shrink-0"></div>
                <span className="text-slate-700 text-xs xl:text-sm font-medium">Private Office</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Services Card */}
        <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-lg animate-fadeIn opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          <h2 className="text-base xl:text-xl font-bold text-slate-800 mb-3 xl:mb-4">Top Services</h2>
          <div className="flex flex-col gap-2 xl:gap-3">
            {[
              { name: 'Dedicated Desk', count: dedicatedDeskStats.tenantCount || 0, color: 'green', bgColor: 'bg-green-500', lightBg: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-700' },
              { name: 'Virtual Office', count: virtualOfficeStats.totalClients || 0, color: 'violet', bgColor: 'bg-violet-500', lightBg: 'bg-violet-50', borderColor: 'border-violet-200', textColor: 'text-violet-700' },
              { name: 'Private Office', count: privateOfficeStats.totalTenants || 0, color: 'blue', bgColor: 'bg-blue-500', lightBg: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' }
            ]
              .sort((a, b) => b.count - a.count)
              .map((service, index) => (
                <div key={service.name} className={`${service.lightBg} rounded-lg xl:rounded-xl p-3 xl:p-4 border-2 ${service.borderColor} flex items-center justify-between gap-2`}>
                  <div className="flex items-center gap-2 xl:gap-3 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 xl:w-8 xl:h-8 rounded-full bg-white border-2 border-gray-200 flex-shrink-0">
                      <span className="text-xs xl:text-sm font-bold text-slate-700">#{index + 1}</span>
                    </div>
                    <div className={`text-xs xl:text-sm font-semibold ${service.textColor} truncate`}>{service.name}</div>
                  </div>
                  <div className={`text-xs xl:text-sm ${service.textColor} font-medium whitespace-nowrap flex-shrink-0`}>{service.count} occupants</div>
                </div>
              ))}
          </div>
        </div>

        {/* Billing Stats Card */}
        <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-lg animate-fadeIn opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
          <h2 className="text-base xl:text-xl font-bold text-slate-800 mb-3 xl:mb-4">Billing Overview</h2>
          <div className="grid grid-cols-2 gap-2 xl:gap-4">
            {/* Row 1 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg xl:rounded-xl p-3 xl:p-4 border-2 border-green-200">
              <div className="text-[10px] xl:text-xs text-green-600 font-medium mb-1">Total Revenue</div>
              <div className="text-base xl:text-2xl font-bold text-green-700 break-words leading-tight">₱{(billingStats.totalRevenue || 0).toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg xl:rounded-xl p-3 xl:p-4 border-2 border-red-200">
              <div className="text-[10px] xl:text-xs text-red-600 font-medium mb-1">Outstanding</div>
              <div className="text-base xl:text-2xl font-bold text-red-700 break-words leading-tight">₱{(billingStats.unpaidAmount || 0).toLocaleString()}</div>
            </div>
            
            {/* Row 2 */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg xl:rounded-xl p-3 xl:p-4 border-2 border-yellow-200">
              <div className="text-[10px] xl:text-xs text-yellow-600 font-medium mb-1">Unpaid Bills</div>
              <div className="text-base xl:text-2xl font-bold text-yellow-700 leading-tight">{billingStats.unpaidCount || 0}</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg xl:rounded-xl p-3 xl:p-4 border-2 border-gray-200">
              <div className="text-[10px] xl:text-xs text-gray-600 font-medium mb-1">Inactive</div>
              <div className="text-base xl:text-2xl font-bold text-gray-700 leading-tight">{billingStats.inactiveCount || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Modals */}
      {selectedService && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease] p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            
            {/* Private Office Modal */}
            {selectedService === 'private-office' && (
              <div className="animate-[fadeIn_0.4s_ease]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                      <MdBusiness size={28} />
                      Private Office
                    </h2>
                    <p className="text-gray-600 text-sm">Meeting rooms and bookings overview</p>
                  </div>
                  <button 
                    onClick={closeModal}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 hover:text-slate-800 transition-all"
                  >
                    ×
                  </button>
                </div>

                {/* Item Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 animate-[stagger_0.6s_ease]">
                  {[
                    { key: 'total', label: 'Total Bookings', value: privateOfficeStats.totalBookings || 0, color: 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200', textColor: 'text-slate-700' },
                    { key: 'rooms', label: 'Total Rooms', value: privateOfficeStats.totalRooms || 0, color: 'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200', textColor: 'text-teal-700' },
                    { key: 'approved', label: 'Approved', value: privateOfficeStats.approved || 0, color: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200', textColor: 'text-green-700' },
                    { key: 'pending', label: 'Pending', value: privateOfficeStats.pending || 0, color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200', textColor: 'text-yellow-700' },
                    { key: 'bookings', label: 'Recent Bookings', value: (privateOfficeStats.recentBookings || []).length, color: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200', textColor: 'text-blue-700' }
                  ].map((item, index) => (
                    <div
                      key={item.key}
                      onClick={() => setSelectedDetailView(item.key)}
                      className={`${item.color} border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-[slideInLeft_0.5s_ease] ${selectedDetailView === item.key ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${item.textColor} mb-1`}>{item.value}</div>
                        <div className={`text-sm font-medium ${item.textColor}`}>{item.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detail Content Below Cards */}
                <div className="animate-[fadeIn_0.4s_ease] border-t-2 border-gray-100 pt-6">
                  {selectedDetailView === 'total' && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">All Bookings ({privateOfficeStats.totalBookings || 0})</h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {schedules.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="text-gray-400 text-4xl mb-4">📅</div>
                            <p className="text-gray-500">No bookings found</p>
                          </div>
                        ) : (
                          schedules.map((booking) => (
                            <div key={booking.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                              <div>
                                <div className="font-semibold text-slate-800">{booking.clientName || 'N/A'}</div>
                                <div className="text-sm text-gray-600">{booking.room || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{booking.startDate || booking.createdAt || 'N/A'}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(booking.status)}`}>
                                {booking.status || 'Unknown'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDetailView === 'rooms' && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">All Meeting Rooms ({privateOfficeStats.totalRooms || 0})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {rooms.length === 0 ? (
                          <div className="col-span-full text-center py-12">
                            <div className="text-gray-400 text-4xl mb-4">🏢</div>
                            <p className="text-gray-500">No rooms found</p>
                          </div>
                        ) : (
                          rooms.map((room) => (
                            <div key={room.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="font-semibold text-slate-800 mb-2">{room.name || 'Unnamed Room'}</div>
                              <div className="text-sm text-gray-600 mb-2">₱{room.rentFee || 0} {room.rentFeePeriod || 'per hour'}</div>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${room.status === 'Occupied' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {room.status || 'Vacant'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDetailView === 'approved' && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">Approved Bookings ({privateOfficeStats.approved || 0})</h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {schedules.filter(booking => booking.status === 'approved').length === 0 ? (
                          <div className="text-center py-12">
                            <div className="text-gray-400 text-4xl mb-4">✅</div>
                            <p className="text-gray-500">No approved bookings found</p>
                          </div>
                        ) : (
                          schedules.filter(booking => booking.status === 'approved').map((booking) => (
                            <div key={booking.id} className="bg-green-50 rounded-lg p-4 flex justify-between items-center border border-green-200">
                              <div>
                                <div className="font-semibold text-slate-800">{booking.clientName || 'N/A'}</div>
                                <div className="text-sm text-gray-600">{booking.room || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{booking.startDate || booking.createdAt || 'N/A'}</div>
                              </div>
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                Approved
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDetailView === 'bookings' && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">Recent Bookings ({(privateOfficeStats.recentBookings || []).length})</h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {(privateOfficeStats.recentBookings || []).length === 0 ? (
                          <div className="text-center py-12">
                            <div className="text-gray-400 text-4xl mb-4">📅</div>
                            <p className="text-gray-500">No recent bookings found</p>
                          </div>
                        ) : (
                          (privateOfficeStats.recentBookings || []).map((booking) => (
                            <div key={booking.id} className="bg-blue-50 rounded-lg p-4 flex justify-between items-center border border-blue-200">
                              <div>
                                <div className="font-semibold text-slate-800">{booking.clientName || 'N/A'}</div>
                                <div className="text-sm text-gray-600">{booking.room || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{booking.startDate || booking.createdAt || 'N/A'}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(booking.status)}`}>
                                {booking.status || 'Unknown'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDetailView === 'pending' && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">Pending Bookings ({privateOfficeStats.pending || 0})</h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {schedules.filter(booking => booking.status === 'pending').length === 0 ? (
                          <div className="text-center py-12">
                            <div className="text-gray-400 text-4xl mb-4">⏳</div>
                            <p className="text-gray-500">No pending bookings found</p>
                          </div>
                        ) : (
                          schedules.filter(booking => booking.status === 'pending').map((booking) => (
                            <div key={booking.id} className="bg-yellow-50 rounded-lg p-4 flex justify-between items-center border border-yellow-200">
                              <div>
                                <div className="font-semibold text-slate-800">{booking.clientName || 'N/A'}</div>
                                <div className="text-sm text-gray-600">{booking.room || 'N/A'}</div>
                                <div className="text-xs text-gray-500">{booking.startDate || booking.createdAt || 'N/A'}</div>
                              </div>
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                Pending
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Virtual Office Modal */}
            {selectedService === 'virtual-office' && (
              <div className="animate-[fadeIn_0.4s_ease]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                      <MdTv size={28} />
                      Virtual Office
                    </h2>
                    <p className="text-gray-600 text-sm">Virtual office clients and services</p>
                  </div>
                  <button 
                    onClick={closeModal}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 hover:text-slate-800 transition-all"
                  >
                    ×
                  </button>
                </div>

                {/* Item Cards */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                  {[
                    { key: 'tenants', label: 'Tenants', value: virtualOfficeStats.totalClients || 0, color: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200', textColor: 'text-blue-700' }
                  ].map((item, index) => (
                    <div
                      key={item.key}
                      onClick={() => setSelectedDetailView(item.key)}
                      className={`${item.color} border-2 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-[slideInLeft_0.5s_ease] ${selectedDetailView === item.key ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${item.textColor} mb-2`}>{item.value}</div>
                        <div className={`text-sm font-medium ${item.textColor}`}>{item.label}</div>
                      </div>
                </div>
              ))}
                </div>

                {/* Detail Content Below Cards */}
                <div className="animate-[fadeIn_0.4s_ease] border-t-2 border-gray-100 pt-6">
                  {selectedDetailView === 'tenants' && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">All Tenants ({virtualOfficeStats.allTenants ? virtualOfficeStats.allTenants.filter(t => t.type === 'Virtual Office Client').length : 0})</h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {!virtualOfficeStats.allTenants || virtualOfficeStats.allTenants.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="text-gray-400 text-4xl mb-4">👥</div>
                            <p className="text-gray-500">No tenants found</p>
                          </div>
                        ) : (
                          virtualOfficeStats.allTenants
                            .filter(tenant => tenant.type === 'Virtual Office Client') // Only show Virtual Office clients
                            .map((tenant) => (
                            <div key={`${tenant.source}-${tenant.id}`} className="bg-blue-50 rounded-lg p-4 flex justify-between items-center border border-blue-200">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="font-semibold text-slate-800">{tenant.name}</div>
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                    {tenant.type}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 mb-1">{tenant.email}</div>
                                <div className="text-sm text-gray-600 mb-1">
                                  {tenant.company !== 'N/A' && tenant.company ? `${tenant.company} • ` : ''}
                                  {tenant.position !== 'N/A' ? tenant.position : ''}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {tenant.phone !== 'N/A' ? `📞 ${tenant.phone}` : ''}
                                  {tenant.startDate ? ` • Started: ${new Date(tenant.startDate).toLocaleDateString()}` : ''}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(tenant.status)}`}>
                                {tenant.status || 'Active'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
            </div>
          )}
        </div>
              </div>
            )}

            {/* Dedicated Desk Modal */}
            {selectedService === 'dedicated-desk' && (
              <div className="animate-[fadeIn_0.4s_ease]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                      <MdDesktopMac size={28} />
                      Dedicated Desk
                    </h2>
                    <p className="text-gray-600 text-sm">Desk assignments and requests</p>
                  </div>
                  <button 
                    onClick={closeModal}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 hover:text-slate-800 transition-all"
                  >
                    ×
                  </button>
                </div>

                {/* Item Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { key: 'assigned', label: 'Total Assigned', value: dedicatedDeskStats.totalAssigned || 0, color: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200', textColor: 'text-purple-700' },
                    { key: 'approved', label: 'Approved', value: dedicatedDeskStats.approved || 0, color: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200', textColor: 'text-green-700' },
                    { key: 'pending', label: 'Pending', value: dedicatedDeskStats.pending || 0, color: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200', textColor: 'text-yellow-700' },
                    { key: 'rejected', label: 'Rejected', value: dedicatedDeskStats.rejected || 0, color: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200', textColor: 'text-red-700' }
                  ].map((item, index) => (
                    <div
                      key={item.key}
                      onClick={() => setSelectedDetailView(item.key)}
                      className={`${item.color} border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-[slideInLeft_0.5s_ease] ${selectedDetailView === item.key ? 'ring-2 ring-purple-500 shadow-lg' : ''}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${item.textColor} mb-1`}>{item.value}</div>
                        <div className={`text-sm font-medium ${item.textColor}`}>{item.label}</div>
                      </div>
            </div>
                  ))}
            </div>

                {/* Detail Content Below Cards */}
                <div className="animate-[fadeIn_0.4s_ease] border-t-2 border-gray-100 pt-6">
                  {selectedDetailView === 'assigned' && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">All Assigned Desks ({dedicatedDeskStats.totalAssigned || 0})</h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {(rawData.deskAssignments || []).length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-3xl mb-2">🪑</div>
                            <p className="text-gray-500">No assigned desks</p>
                          </div>
                        ) : (
                          (rawData.deskAssignments || []).map((assignment) => (
                            <div key={assignment.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                              <div>
                                <div className="font-semibold text-slate-800">{assignment.name || 'N/A'}</div>
                                <div className="text-sm text-gray-600">{assignment.email || 'N/A'}</div>
                                <div className="text-xs text-gray-500">Desk: {assignment.deskTag || assignment.assignedDesk || 'N/A'}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${assignment.type === 'Employee' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {assignment.type || 'N/A'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDetailView === 'approved' && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">Approved Requests ({dedicatedDeskStats.approved || 0})</h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {(dedicatedDeskStats.recentRequests || []).filter(r => r.status === 'approved').length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-3xl mb-2">✅</div>
                            <p className="text-gray-500">No approved requests</p>
                          </div>
                        ) : (
                          (rawData.deskRequests || []).filter(r => r.status === 'approved').map((request) => (
                            <div key={request.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                              <div>
                                <div className="font-semibold text-slate-800">{request.userInfo?.firstName} {request.userInfo?.lastName}</div>
                                <div className="text-sm text-gray-600">{request.userInfo?.email}</div>
                                <div className="text-xs text-gray-500">{request.requestDate || request.createdAt || 'N/A'}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                                {request.status || 'Unknown'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDetailView === 'pending' && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">Pending Requests ({dedicatedDeskStats.pending || 0})</h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {(dedicatedDeskStats.recentRequests || []).filter(r => r.status === 'pending').length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-3xl mb-2">⏳</div>
                            <p className="text-gray-500">No pending requests</p>
                          </div>
                        ) : (
                          (rawData.deskRequests || []).filter(r => r.status === 'pending').map((request) => (
                            <div key={request.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                              <div>
                                <div className="font-semibold text-slate-800">{request.userInfo?.firstName} {request.userInfo?.lastName}</div>
                                <div className="text-sm text-gray-600">{request.userInfo?.email}</div>
                                <div className="text-xs text-gray-500">{request.requestDate || request.createdAt || 'N/A'}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                                {request.status || 'Unknown'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {selectedDetailView === 'rejected' && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">Rejected Requests ({dedicatedDeskStats.rejected || 0})</h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {(dedicatedDeskStats.recentRequests || []).filter(r => r.status === 'rejected').length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-3xl mb-2">❌</div>
                            <p className="text-gray-500">No rejected requests</p>
                          </div>
                        ) : (
                          (rawData.deskRequests || []).filter(r => r.status === 'rejected').map((request) => (
                            <div key={request.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                              <div>
                                <div className="font-semibold text-slate-800">{request.userInfo?.firstName} {request.userInfo?.lastName}</div>
                                <div className="text-sm text-gray-600">{request.userInfo?.email}</div>
                                <div className="text-xs text-gray-500">{request.requestDate || request.createdAt || 'N/A'}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                                {request.status || 'Unknown'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {!selectedDetailView && (
                    <div>
                      <h4 className="text-lg font-semibold text-slate-800 mb-4">Recent Requests</h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {(dedicatedDeskStats.recentRequests || []).length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-3xl mb-2">📋</div>
                            <p className="text-gray-500">No recent requests</p>
                          </div>
                        ) : (
                          (dedicatedDeskStats.recentRequests || []).map((request) => (
                            <div key={request.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                              <div>
                                <div className="font-semibold text-slate-800">{request.userInfo?.firstName} {request.userInfo?.lastName}</div>
                                <div className="text-sm text-gray-600">{request.userInfo?.email}</div>
                                <div className="text-xs text-gray-500">{request.requestDate || request.createdAt || 'N/A'}</div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                                {request.status || 'Unknown'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
      </div>
        </div>,
        document.body
      )}
    </div>
  );
}