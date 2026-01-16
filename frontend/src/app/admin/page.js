'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function AdminDashboard() {
  const [rooms, setRooms] = useState([]);
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubSchedules = onSnapshot(collection(db, 'schedules'), (snapshot) => {
      setSchedules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubRooms(); unsubSchedules(); };
  }, []);

  const stats = [
    { label: 'Rooms', value: rooms.length, icon: '🏢', iconBg: 'from-teal-50 to-teal-100', borderColor: 'border-l-teal-600' },
    { label: 'Reservations', value: schedules.length, icon: '📅', iconBg: 'from-blue-50 to-blue-100', borderColor: 'border-l-blue-600' },
    { label: 'Pending', value: schedules.filter(s => s.status === 'pending').length, icon: '⏳', iconBg: 'from-yellow-100 to-yellow-200', borderColor: 'border-l-yellow-500' },
    { label: 'Active', value: schedules.filter(s => s.status === 'upcoming' || s.status === 'ongoing' || s.status === 'active').length, icon: '▶️', iconBg: 'from-green-100 to-green-200', borderColor: 'border-l-green-500' },
  ];

  const recentBookings = schedules.slice(0, 5);

  return (
    <div className="w-full animate-fadeIn">
      <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 animate-slideInLeft">Dashboard</h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-white rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-stagger animate-stagger-${i + 1} border-l-[3px] sm:border-l-4 ${stat.borderColor}`}>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-linear-to-br ${stat.iconBg} flex items-center justify-center text-lg sm:text-xl lg:text-2xl shadow-sm sm:shadow-md shrink-0`}>
              {stat.icon}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">{stat.value}</span>
              <span className="text-xs sm:text-sm text-gray-500 font-semibold uppercase tracking-wide whitespace-nowrap">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-200 shadow-sm animate-slideUp" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
          <h2 className="text-slate-800 text-base sm:text-lg font-bold mb-3 sm:mb-4">Recent Bookings</h2>
          {recentBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-2.5 sm:p-3 bg-gray-50 rounded-xl">
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 font-semibold text-sm sm:text-base truncate">{booking.clientName}</p>
                    <p className="text-gray-500 text-xs sm:text-sm truncate">{booking.room} • {booking.date || booking.startDate || 'N/A'}</p>
                  </div>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] xs:text-xs font-semibold capitalize whitespace-nowrap shrink-0 ${
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    booking.status === 'upcoming' || booking.status === 'active' || booking.status === 'ongoing' ? 'bg-teal-100 text-teal-700' :
                    booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{booking.status === 'upcoming' || booking.status === 'ongoing' ? 'Active' : booking.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 border border-gray-200 shadow-sm animate-slideUp" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
          <h2 className="text-slate-800 text-base sm:text-lg font-bold mb-3 sm:mb-4">Quick Stats</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600 text-xs sm:text-sm">Completed Reservations</span>
              <span className="text-slate-800 font-bold text-sm sm:text-base">{schedules.filter(s => s.status === 'completed').length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
              <div className="bg-green-500 h-1.5 sm:h-2 rounded-full transition-all" style={{ width: `${schedules.length ? (schedules.filter(s => s.status === 'completed').length / schedules.length) * 100 : 0}%` }}></div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600 text-xs sm:text-sm">Rejected Reservations</span>
              <span className="text-slate-800 font-bold text-sm sm:text-base">{schedules.filter(s => s.status === 'rejected').length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
              <div className="bg-red-500 h-1.5 sm:h-2 rounded-full transition-all" style={{ width: `${schedules.length ? (schedules.filter(s => s.status === 'rejected').length / schedules.length) * 100 : 0}%` }}></div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600 text-xs sm:text-sm">Active</span>
              <span className="text-slate-800 font-bold text-sm sm:text-base">{schedules.filter(s => s.status === 'upcoming' || s.status === 'ongoing' || s.status === 'active').length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
              <div className="bg-teal-500 h-1.5 sm:h-2 rounded-full transition-all" style={{ width: `${schedules.length ? ((schedules.filter(s => s.status === 'upcoming' || s.status === 'ongoing' || s.status === 'active').length) / schedules.length) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
