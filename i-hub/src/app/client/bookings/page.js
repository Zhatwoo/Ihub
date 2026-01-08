'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'schedules'), (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date descending (newest first)
      bookingsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBookings(bookingsData);
    });
    return () => unsubscribe();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⏳' },
      upcoming: { bg: 'bg-teal-100', text: 'text-teal-700', icon: '📅' },
      ongoing: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '▶️' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: '✅' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: '❌' }
    };
    return styles[status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📋' };
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = booking.room?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          booking.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          booking.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    upcoming: bookings.filter(b => b.status === 'upcoming').length,
    ongoing: bookings.filter(b => b.status === 'ongoing').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
  };

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">My Bookings</h1>
        <p className="text-gray-600 mt-1">View and track your reservations</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab.key ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-600 hover:text-teal-600'}`}
            >
              {tab.label} ({statusCounts[tab.key]})
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search bookings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white md:ml-auto w-full md:w-64 transition-all"
        />
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500">{searchTerm || filter !== 'all' ? 'No bookings found.' : 'You have no bookings yet.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredBookings.map((booking) => {
            const status = getStatusBadge(booking.status);
            return (
              <div key={booking.id} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg hover:border-teal-600/30 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-slate-800 font-bold text-xl">{booking.room}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize flex items-center gap-1.5 ${status.bg} ${status.text}`}>
                        <span>{status.icon}</span>
                        {booking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase font-semibold">Date</span>
                        <span className="text-slate-800 font-medium">{booking.date}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase font-semibold">Time</span>
                        <span className="text-slate-800 font-medium">{booking.time}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase font-semibold">Guests</span>
                        <span className="text-slate-800 font-medium">{booking.guests} people</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-xs uppercase font-semibold">Purpose</span>
                        <span className="text-slate-800 font-medium">{booking.purpose}</span>
                      </div>
                    </div>
                    {booking.specialRequest && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">Special Request: </span>
                        <span className="text-slate-700">{booking.specialRequest}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
