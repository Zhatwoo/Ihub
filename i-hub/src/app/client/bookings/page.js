'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Currency symbol helper
  const getCurrencySymbol = (currency) => {
    const symbols = {
      'PHP': '₱', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
      'AUD': 'A$', 'CAD': 'C$', 'CNY': '¥', 'INR': '₹', 'SGD': 'S$'
    };
    return symbols[currency] || '₱';
  };

  // Fetch bookings
  useEffect(() => {
    if (!db) {
      console.warn('Firebase is not initialized. Please configure your .env.local file.');
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'schedules'), (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date descending (newest first)
      bookingsData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setBookings(bookingsData);
    });
    return () => unsubscribe();
  }, []);

  // Fetch rooms to get rental fee information
  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomsData);
    });
    return () => unsubscribe();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⏳', label: 'Pending' },
      upcoming: { bg: 'bg-teal-100', text: 'text-teal-700', icon: '▶️', label: 'Active' },
      ongoing: { bg: 'bg-teal-100', text: 'text-teal-700', icon: '▶️', label: 'Active' },
      active: { bg: 'bg-teal-100', text: 'text-teal-700', icon: '▶️', label: 'Active' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: '✅', label: 'Completed' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: '❌', label: 'Rejected' }
    };
    return styles[status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📋', label: status };
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter || (filter === 'active' && (booking.status === 'upcoming' || booking.status === 'ongoing' || booking.status === 'active'));
    const matchesSearch = booking.room?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          booking.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          booking.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          booking.contactNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    active: bookings.filter(b => b.status === 'upcoming' || b.status === 'ongoing' || b.status === 'active').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    rejected: bookings.filter(b => b.status === 'rejected').length,
  };

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'rejected', label: 'Rejected' },
  ];

  // Get room data for a booking
  const getRoomData = (roomId) => {
    return rooms.find(room => room.id === roomId) || null;
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">My Bookings</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">View and track your reservations</p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all ${filter === tab.key ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-600 hover:text-teal-600'}`}
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
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white lg:ml-auto w-full lg:w-64 transition-all"
          />
        </div>

        {filteredBookings.length === 0 ? (
          <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-gray-200">
            <div className="text-center py-12">
              <div className="text-5xl lg:text-6xl mb-4">📋</div>
              <p className="text-gray-500 text-base lg:text-lg">{searchTerm || filter !== 'all' ? 'No bookings found.' : 'You have no bookings yet.'}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Office</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Start Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Date Requested</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Rental Fee</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBookings.map((booking) => {
                    const status = getStatusBadge(booking.status);
                    const roomData = getRoomData(booking.roomId);
                    return (
                      <tr key={booking.id} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                        <td className="px-4 py-4">
                          <span className="text-slate-800 font-semibold text-sm">{booking.room || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-600 text-sm">
                            {booking.startDate ? new Date(booking.startDate).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-600 text-sm">
                            {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-600 text-sm truncate block max-w-[200px]" title={booking.email || 'N/A'}>
                            {booking.email || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-600 text-sm">{booking.contactNumber || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-4">
                          {roomData ? (
                            <span className="text-slate-800 font-semibold text-sm">
                              {getCurrencySymbol(roomData.currency || 'PHP')}{roomData.rentFee?.toLocaleString() || '0'} {roomData.rentFeePeriod || 'per hour'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap ${status.bg} ${status.text}`}>
                              <span>{status.icon}</span>
                              {status.label}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
