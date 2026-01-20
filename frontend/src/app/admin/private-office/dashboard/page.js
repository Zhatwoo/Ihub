'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function Dashboard() {
  const [schedules, setSchedules] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [roomFilter, setRoomFilter] = useState('all');

  // Fetch schedules from API
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await api.get('/api/schedules');
        if (response.success && response.data) {
          // Filter for private office requests
          const privateOfficeRequests = response.data.filter(
            schedule => schedule.requestType === 'privateroom' || 
                       (!schedule.requestType && schedule.room && schedule.roomId)
          );
          setSchedules(privateOfficeRequests);
        }
      } catch (error) {
        console.error('Error fetching schedules:', error);
      }
    };
    fetchSchedules();
  }, []);

  const getSchedulesByStatus = (status) => {
    if (status === 'total') return schedules;
    if (status === 'active') {
      // Active includes both upcoming and ongoing
      return schedules.filter(s => s.status === 'upcoming' || s.status === 'ongoing' || s.status === 'active');
    }
    return schedules.filter(s => s.status === status);
  };

  const applyFiltersAndSort = (data) => {
    let result = [...data];
    if (scheduleSearch) {
      const search = scheduleSearch.toLowerCase();
      result = result.filter(s => 
        s.clientName?.toLowerCase().includes(search) || 
        s.email?.toLowerCase().includes(search) ||
        s.contactNumber?.toLowerCase().includes(search) ||
        s.room?.toLowerCase().includes(search)
      );
    }
    if (roomFilter !== 'all') {
      result = result.filter(s => s.room === roomFilter);
    }
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') comparison = new Date(a.startDate || a.createdAt) - new Date(b.startDate || b.createdAt);
      else if (sortBy === 'client') comparison = (a.clientName || '').localeCompare(b.clientName || '');
      else if (sortBy === 'room') comparison = (a.room || '').localeCompare(b.room || '');
      else if (sortBy === 'email') comparison = (a.email || '').localeCompare(b.email || '');
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return result;
  };

  const filteredSchedules = selectedFilter ? applyFiltersAndSort(getSchedulesByStatus(selectedFilter)) : [];
  const uniqueRooms = [...new Set(schedules.map(s => s.room).filter(Boolean))];

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      upcoming: 'bg-teal-100 text-teal-700',
      ongoing: 'bg-teal-100 text-teal-700',
      active: 'bg-teal-100 text-teal-700',
      completed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return styles[status] || '';
  };

  const statCards = [
    { key: 'total', icon: '📊', label: 'Total', color: 'border-l-teal-600', iconBg: 'from-cyan-50 to-cyan-100', ring: 'ring-teal-600 shadow-teal-600/20' },
    { key: 'pending', icon: '⏳', label: 'Pending', color: 'border-l-yellow-500', iconBg: 'from-yellow-100 to-yellow-200', ring: 'ring-yellow-500 shadow-yellow-500/20' },
    { key: 'active', icon: '▶️', label: 'Active', color: 'border-l-teal-500', iconBg: 'from-teal-100 to-teal-200', ring: 'ring-teal-500 shadow-teal-500/20' },
    { key: 'rejected', icon: '❌', label: 'Rejected', color: 'border-l-red-500', iconBg: 'from-red-100 to-red-200', ring: 'ring-red-500 shadow-red-500/20' },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 animate-fadeIn">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {statCards.map(card => (
          <div 
            key={card.key} 
            onClick={() => setSelectedFilter(card.key)} 
            className={`bg-white rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 border border-gray-200 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-800/10 border-l-[3px] sm:border-l-4 ${card.color} ${selectedFilter === card.key ? `ring-2 ${card.ring} -translate-y-0.5 shadow-xl` : ''} overflow-hidden`}
          >
            <div className={`text-lg sm:text-xl lg:text-2xl w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-gradient-to-br ${card.iconBg} shrink-0 shadow-sm sm:shadow-md`}>
              {card.icon}
            </div>
            <div className="flex flex-row items-baseline gap-1.5 sm:gap-2 flex-1 min-w-0 overflow-hidden">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 whitespace-nowrap shrink-0">
                {card.key === 'total' ? schedules.length : 
                 card.key === 'active' ? schedules.filter(s => s.status === 'upcoming' || s.status === 'ongoing' || s.status === 'active').length :
                 schedules.filter(s => s.status === card.key).length}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 font-semibold wrap-break-word leading-tight uppercase tracking-wide flex-1 min-w-0 hyphens-auto">
                {card.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedFilter && (
        <div className="mt-4 sm:mt-6 bg-gray-50 rounded-xl p-3 sm:p-4 lg:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4">
            <h3 className="text-slate-800 text-base sm:text-lg font-semibold whitespace-nowrap">
              {selectedFilter === 'total' ? 'All Reservations' : 
               selectedFilter === 'active' ? 'Active Reservations' :
               `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Reservations`}
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-2.5 items-center w-full sm:w-auto sm:ml-auto">
              <input 
                type="text" 
                placeholder="Search..." 
                value={scheduleSearch} 
                onChange={(e) => setScheduleSearch(e.target.value)} 
                className="flex-1 min-w-[150px] max-w-[220px] px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-600" 
              />
              <select 
                value={roomFilter} 
                onChange={(e) => setRoomFilter(e.target.value)} 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white cursor-pointer focus:outline-none focus:border-teal-600"
              >
                <option value="all">All Offices</option>
                {uniqueRooms.map(room => <option key={room} value={room}>{room}</option>)}
              </select>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white cursor-pointer focus:outline-none focus:border-teal-600"
              >
                <option value="date">Sort by Start Date</option>
                <option value="client">Sort by Client</option>
                <option value="room">Sort by Office</option>
                <option value="email">Sort by Email</option>
              </select>
              <button 
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} 
                className="w-9 h-9 border border-teal-600 rounded-lg bg-teal-50 text-teal-600 font-bold flex items-center justify-center hover:bg-teal-600 hover:text-white transition-all"
              >
                {sortOrder === 'asc' ? '▲' : '▼'}
              </button>
              <button 
                onClick={() => { setSelectedFilter(null); setScheduleSearch(''); setRoomFilter('all'); }} 
                className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white hover:bg-gray-100 whitespace-nowrap"
              >
                Clear Filter
              </button>
            </div>
          </div>
          {filteredSchedules.length === 0 ? (
            <p className="text-gray-500 text-center py-8 sm:py-10 text-sm">No reservations found.</p>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-full inline-block align-middle">
                <div className="flex flex-col gap-2 min-w-[800px] sm:min-w-0">
                  <div className="hidden sm:grid grid-cols-[1.2fr_1.2fr_1fr_0.9fr_0.9fr_0.8fr] gap-3 px-4 py-3 bg-slate-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wide">
                    <span>Full Name</span><span>Email</span><span>Office</span><span>Start Date</span><span>Contact</span><span>Status</span>
                  </div>
                  {filteredSchedules.map((schedule) => (
                    <div key={schedule.id} className="sm:grid grid-cols-[1.2fr_1.2fr_1fr_0.9fr_0.9fr_0.8fr] gap-3 px-3 sm:px-4 py-3 sm:py-3.5 bg-white rounded-lg text-xs sm:text-sm text-gray-600 items-center border border-gray-200 hover:shadow-lg hover:shadow-slate-800/10 hover:border-teal-600 transition-all">
                      <div className="sm:contents">
                        <div className="flex sm:contents justify-between items-start mb-2 sm:mb-0">
                          <div className="sm:hidden text-gray-500 font-semibold mb-1">Name:</div>
                          <span className="text-slate-800 font-semibold truncate">{schedule.clientName}</span>
                        </div>
                        <div className="flex sm:contents justify-between items-start mb-2 sm:mb-0">
                          <div className="sm:hidden text-gray-500 font-semibold mb-1">Email:</div>
                          <span className="text-sm truncate" title={schedule.email || 'N/A'}>{schedule.email || 'N/A'}</span>
                        </div>
                        <div className="flex sm:contents justify-between items-start mb-2 sm:mb-0">
                          <div className="sm:hidden text-gray-500 font-semibold mb-1">Office:</div>
                          <span className="truncate">{schedule.room}</span>
                        </div>
                        <div className="flex sm:contents justify-between items-start mb-2 sm:mb-0">
                          <div className="sm:hidden text-gray-500 font-semibold mb-1">Start Date:</div>
                          <span className="whitespace-nowrap">{schedule.startDate ? new Date(schedule.startDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex sm:contents justify-between items-start mb-2 sm:mb-0">
                          <div className="sm:hidden text-gray-500 font-semibold mb-1">Contact:</div>
                          <span className="text-sm truncate">{schedule.contactNumber || 'N/A'}</span>
                        </div>
                        <div className="flex sm:contents justify-between items-start">
                          <div className="sm:hidden text-gray-500 font-semibold mb-1">Status:</div>
                          <span className={`px-2 sm:px-2.5 py-1 rounded-full text-[10px] xs:text-xs font-semibold capitalize text-center ${getStatusBadge(schedule.status)}`}>
                            {schedule.status === 'upcoming' || schedule.status === 'ongoing' ? 'Active' : schedule.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}