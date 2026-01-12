'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';

export default function PrivateOffices() {
  // Currency symbol helper
  const getCurrencySymbol = (currency) => {
    const symbols = {
      'PHP': '₱',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'CNY': '¥',
      'INR': '₹',
      'SGD': 'S$'
    };
    return symbols[currency] || '₱';
  };

  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsRoom, setDetailsRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    startDate: ''
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomsData);
    });
    return () => unsubscribe();
  }, []);

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openReservationModal = (room) => {
    setSelectedRoom(room);
    setShowReservationModal(true);
  };

  const closeReservationModal = () => {
    setShowReservationModal(false);
    setSelectedRoom(null);
    setFormData({ fullName: '', email: '', contactNumber: '', startDate: '' });
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const reservationData = {
        clientName: formData.fullName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        room: selectedRoom.name,
        roomId: selectedRoom.id,
        startDate: formData.startDate,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'schedules'), reservationData);
      closeReservationModal();
      showAlert('success', 'Reservation request submitted successfully!');
    } catch (error) {
      console.error('Error submitting reservation:', error);
      showAlert('error', 'Failed to submit reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">Private Offices</h1>
            <p className="text-gray-600 mt-1 text-sm lg:text-base">Browse and book available private offices</p>
          </div>
          <input 
            type="text" 
            placeholder="Search offices..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white w-full md:w-72 transition-all" 
          />
        </div>

        {filteredRooms.length === 0 ? (
          <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-gray-200">
            <div className="text-center py-12">
              <div className="text-5xl lg:text-6xl mb-4">🏢</div>
              <p className="text-gray-500 text-base lg:text-lg">{searchTerm ? 'No offices found.' : 'No private offices available yet.'}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {filteredRooms.map((room) => (
              <div 
                key={room.id} 
                className="bg-white rounded-2xl overflow-hidden border border-gray-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-800/10 group flex flex-col"
              >
                <div className="relative w-full h-40 lg:h-48 xl:h-52 bg-gray-100">
                  {room.image ? (
                    <Image src={room.image} alt={room.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl">🏢</div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-4 lg:p-5 flex flex-col flex-1">
                  <h3 className="text-slate-800 font-bold text-lg lg:text-xl mb-2">{room.name}</h3>
                  <div className="flex items-center gap-2 text-gray-500 text-xs lg:text-sm mb-2">
                    <span className="text-teal-600">💰</span>
                    <span>Rental Fee: {getCurrencySymbol(room.currency || 'PHP')}{room.rentFee?.toLocaleString() || '0'} {room.rentFeePeriod || 'per hour'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailsRoom(room);
                      setShowDetailsModal(true);
                    }}
                    className="text-teal-600 hover:text-teal-700 text-xs lg:text-sm font-semibold mb-2 transition-colors text-left"
                  >
                    Full Details
                  </button>
                  <button 
                    onClick={() => openReservationModal(room)}
                    className="mt-auto w-full py-2.5 lg:py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-teal-600/30 transition-all"
                  >
                    Add Reservation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showReservationModal && selectedRoom && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease]">
          <div className="bg-white rounded-2xl p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
              <div>
                <h2 className="text-slate-800 text-xl font-bold">Add Reservation</h2>
                <p className="text-gray-500 text-sm mt-1">{selectedRoom.name}</p>
              </div>
              <button onClick={closeReservationModal} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 hover:text-slate-800 transition-all">×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your full name" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
              </div>

              <div className="mb-4">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email address" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
              </div>

              <div className="mb-4">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Contact Number</label>
                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} placeholder="Enter your contact number" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
              </div>

              <div className="mb-4">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Start Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
              </div>

              <div className="mb-6">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Rental Fee</label>
                <input type="text" value={`${getCurrencySymbol(selectedRoom.currency || 'PHP')}${selectedRoom.rentFee?.toLocaleString() || '0'} ${selectedRoom.rentFeePeriod || 'per hour'}`} disabled className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-100 cursor-not-allowed transition-all" />
                <p className="text-gray-400 text-xs mt-1">Rental fee for this office</p>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={closeReservationModal} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? 'Submitting...' : 'Submit Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsModal && detailsRoom && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease]">
          <div className="bg-white rounded-2xl p-7 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
              <h2 className="text-slate-800 text-2xl font-bold">Full Details</h2>
              <button 
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsRoom(null);
                }} 
                className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 hover:text-slate-800 transition-all"
              >
                ×
              </button>
            </div>

            <div className="relative w-full h-64 rounded-xl overflow-hidden mb-6 shadow-lg bg-gray-100">
              {detailsRoom.image ? (
                <Image src={detailsRoom.image} alt={detailsRoom.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">🏢</div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Office Name</span>
                <span className="text-slate-800 text-xl font-semibold">{detailsRoom.name}</span>
              </div>

              <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Rental Fee</span>
                <span className="text-slate-800 text-xl font-semibold">
                  {getCurrencySymbol(detailsRoom.currency || 'PHP')}{detailsRoom.rentFee?.toLocaleString() || '0'} {detailsRoom.rentFeePeriod || 'per hour'}
                </span>
              </div>

              {detailsRoom.inclusions && (
                <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Inclusions</span>
                  <span className="text-slate-800 text-lg whitespace-pre-line">{detailsRoom.inclusions}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsRoom(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsRoom(null);
                  openReservationModal(detailsRoom);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:shadow-xl transition-all"
              >
                Add Reservation
              </button>
            </div>
          </div>
        </div>
      )}

      {alert.show && (
        <div className="fixed top-6 right-6 z-50 animate-[slideUp_0.3s_ease]">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${alert.type === 'success' ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 text-white'}`}>
            <span className="text-2xl">{alert.type === 'success' ? '✓' : '✕'}</span>
            <span className="font-medium">{alert.message}</span>
            <button onClick={() => setAlert({ show: false, type: '', message: '' })} className="ml-2 text-white/80 hover:text-white text-xl">×</button>
          </div>
        </div>
      )}
    </div>
  );
}


