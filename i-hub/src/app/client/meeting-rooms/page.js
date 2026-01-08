'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';

export default function MeetingRooms() {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    timeStart: '',
    timeEnd: '',
    guests: '',
    purpose: '',
    specialRequest: ''
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
    setFormData({ name: '', date: '', timeStart: '', timeEnd: '', guests: '', purpose: '', specialRequest: '' });
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
        clientName: formData.name,
        room: selectedRoom.name,
        roomId: selectedRoom.id,
        date: formData.date,
        timeStart: formData.timeStart,
        timeEnd: formData.timeEnd,
        time: `${formData.timeStart} - ${formData.timeEnd}`,
        guests: parseInt(formData.guests),
        purpose: formData.purpose,
        specialRequest: formData.specialRequest || '',
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
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Meeting Rooms</h1>
          <p className="text-gray-600 mt-1">Browse and book available meeting rooms</p>
        </div>
        <input 
          type="text" 
          placeholder="Search rooms..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white w-full md:w-72 transition-all" 
        />
      </div>

      {filteredRooms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-gray-500">{searchTerm ? 'No rooms found.' : 'No meeting rooms available yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div 
              key={room.id} 
              className="bg-white rounded-2xl overflow-hidden border border-gray-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-800/10 group"
            >
              <div className="relative w-full h-48 bg-gray-100">
                {room.image ? (
                  <Image src={room.image} alt={room.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl">🏢</div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="p-5">
                <h3 className="text-slate-800 font-bold text-xl mb-2">{room.name}</h3>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                  <span className="text-teal-600">👥</span>
                  <span>Up to {room.capacity} people</span>
                </div>
                {room.inclusions && (
                  <p className="text-gray-500 text-sm line-clamp-2">{room.inclusions}</p>
                )}
                <button 
                  onClick={() => openReservationModal(room)}
                  className="mt-4 w-full py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-teal-600/30 transition-all"
                >
                  Add Reservation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showReservationModal && selectedRoom && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease]" onClick={closeReservationModal}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
              <div>
                <h2 className="text-slate-800 text-xl font-bold">Add Reservation</h2>
                <p className="text-gray-500 text-sm mt-1">{selectedRoom.name}</p>
              </div>
              <button onClick={closeReservationModal} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 hover:text-slate-800 transition-all">×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Your Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
              </div>

              <div className="mb-4">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-sm">Time Start</label>
                  <input type="time" name="timeStart" value={formData.timeStart} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-sm">Time End</label>
                  <input type="time" name="timeEnd" value={formData.timeEnd} onChange={handleChange} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Number of Guests</label>
                <input type="number" name="guests" value={formData.guests} onChange={handleChange} placeholder="Enter number of guests" min="1" max={selectedRoom.capacity} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
                <p className="text-gray-400 text-xs mt-1">Maximum capacity: {selectedRoom.capacity} people</p>
              </div>

              <div className="mb-4">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Purpose</label>
                <input type="text" name="purpose" value={formData.purpose} onChange={handleChange} placeholder="e.g. Team Meeting, Workshop" required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
              </div>

              <div className="mb-6">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Special Request <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea name="specialRequest" value={formData.specialRequest} onChange={handleChange} placeholder="Any special requirements or requests" rows="3" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all resize-none" />
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
