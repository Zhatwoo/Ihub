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
    { label: 'Total Rooms', value: rooms.length, icon: '🏢', color: 'from-teal-500 to-teal-600' },
    { label: 'Total Reservations', value: schedules.length, icon: '📅', color: 'from-blue-500 to-blue-600' },
    { label: 'Pending Requests', value: schedules.filter(s => s.status === 'pending').length, icon: '⏳', color: 'from-yellow-500 to-yellow-600' },
    { label: 'Upcoming', value: schedules.filter(s => s.status === 'upcoming').length, icon: '📆', color: 'from-green-500 to-green-600' },
  ];

  const recentBookings = schedules.slice(0, 5);

  return (
    <div className="max-w-6xl animate-fadeIn">
      <h1 className="text-slate-800 text-3xl font-bold mb-8 animate-slideInLeft">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all animate-stagger animate-stagger-${i + 1}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-lg`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm animate-slideUp" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
          <h2 className="text-slate-800 text-lg font-bold mb-4">Recent Bookings</h2>
          {recentBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-slate-800 font-semibold">{booking.clientName}</p>
                    <p className="text-gray-500 text-sm">{booking.room} • {booking.date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    booking.status === 'upcoming' ? 'bg-teal-100 text-teal-700' :
                    booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{booking.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm animate-slideUp" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
          <h2 className="text-slate-800 text-lg font-bold mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Completed Reservations</span>
              <span className="text-slate-800 font-bold">{schedules.filter(s => s.status === 'completed').length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${schedules.length ? (schedules.filter(s => s.status === 'completed').length / schedules.length) * 100 : 0}%` }}></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Rejected Reservations</span>
              <span className="text-slate-800 font-bold">{schedules.filter(s => s.status === 'rejected').length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${schedules.length ? (schedules.filter(s => s.status === 'rejected').length / schedules.length) * 100 : 0}%` }}></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Ongoing</span>
              <span className="text-slate-800 font-bold">{schedules.filter(s => s.status === 'ongoing').length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${schedules.length ? (schedules.filter(s => s.status === 'ongoing').length / schedules.length) * 100 : 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
