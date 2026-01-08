'use client';

import { useState } from 'react';
import Image from 'next/image';

const dummyRooms = [
  { id: 'dummy1', name: 'Buffet Hall', capacity: 50, inclusions: 'Projector, Sound System, Buffet Setup', image: '/dining/buffet.png' },
  { id: 'dummy2', name: 'Fine Dining Room', capacity: 20, inclusions: 'TV, Whiteboard, Premium Furniture', image: '/dining/fine_dining.png' },
  { id: 'dummy3', name: 'Private Chef Suite', capacity: 12, inclusions: 'Kitchen Access, Private Chef, Wine Selection', image: '/dining/private_chef.png' },
  { id: 'dummy4', name: 'Rooftop Lounge', capacity: 30, inclusions: 'Open Air, Bar, City View', image: '/dining/rooftop.png' },
];

const dummySchedules = [
  { id: 1, clientName: 'John Smith', room: 'Buffet Hall', date: 'Jan 10, 2026', time: '2hrs (9am - 11am)', guests: 25, purpose: 'Team Meeting', inclusions: 'Projector, Coffee', status: 'upcoming' },
  { id: 2, clientName: 'Sarah Johnson', room: 'Fine Dining Room', date: 'Jan 8, 2026', time: '1hr (2pm - 3pm)', guests: 8, purpose: 'Client Presentation', inclusions: 'TV, Whiteboard', status: 'ongoing' },
  { id: 3, clientName: 'Mike Chen', room: 'Rooftop Lounge', date: 'Jan 12, 2026', time: '3hrs (6pm - 9pm)', guests: 20, purpose: 'Birthday Party', inclusions: 'Bar, Sound System', status: 'pending' },
  { id: 4, clientName: 'Emily Davis', room: 'Private Chef Suite', date: 'Jan 5, 2026', time: '2hrs (12pm - 2pm)', guests: 6, purpose: 'Business Lunch', inclusions: 'Private Chef', status: 'completed' },
  { id: 5, clientName: 'Robert Wilson', room: 'Buffet Hall', date: 'Jan 15, 2026', time: '4hrs (1pm - 5pm)', guests: 40, purpose: 'Workshop', inclusions: 'Projector, Mics', status: 'upcoming' },
  { id: 6, clientName: 'Lisa Anderson', room: 'Fine Dining Room', date: 'Jan 3, 2026', time: '1hr (10am - 11am)', guests: 10, purpose: 'Interview', inclusions: 'None', status: 'rejected' },
  { id: 7, clientName: 'David Brown', room: 'Rooftop Lounge', date: 'Jan 7, 2026', time: '2hrs (7pm - 9pm)', guests: 15, purpose: 'Networking Event', inclusions: 'Bar', status: 'completed' },
  { id: 8, clientName: 'Anna Martinez', room: 'Private Chef Suite', date: 'Jan 9, 2026', time: '1hr (7am - 8am)', guests: 4, purpose: 'Breakfast Meeting', inclusions: 'Private Chef', status: 'ongoing' },
  { id: 9, clientName: 'James Taylor', room: 'Buffet Hall', date: 'Jan 11, 2026', time: '2hrs (3pm - 5pm)', guests: 30, purpose: 'Training Session', inclusions: 'Projector', status: 'pending' },
  { id: 10, clientName: 'Karen White', room: 'Fine Dining Room', date: 'Jan 6, 2026', time: '1hr (4pm - 5pm)', guests: 12, purpose: 'Board Meeting', inclusions: 'TV, Coffee', status: 'completed' },
];

export default function MeetingRoom() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [rooms, setRooms] = useState(dummyRooms);
  const [schedules] = useState(dummySchedules);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [roomFilter, setRoomFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({ name: '', capacity: '', inclusions: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const newRoom = { id: Date.now().toString(), name: formData.name, capacity: parseInt(formData.capacity), inclusions: formData.inclusions, image: '/dining/buffet.png' };
    if (editingRoom) {
      setRooms(rooms.map(r => r.id === editingRoom.id ? { ...r, ...newRoom, id: editingRoom.id, image: editingRoom.image } : r));
    } else {
      setRooms([...rooms, newRoom]);
    }
    setFormData({ name: '', capacity: '', inclusions: '' });
    setEditingRoom(null);
    setShowFormModal(false);
    setLoading(false);
  };

  const handleEdit = () => { setShowViewModal(false); setEditingRoom(selectedRoom); setFormData({ name: selectedRoom.name, capacity: selectedRoom.capacity.toString(), inclusions: selectedRoom.inclusions || '' }); setShowFormModal(true); };
  const handleDelete = () => { 
    if (!selectedRoom) return;
    const roomId = selectedRoom.id;
    if (confirm('Delete this room?')) { 
      setShowViewModal(false); 
      setSelectedRoom(null); 
      setRooms(rooms.filter(r => r.id !== roomId)); 
    } 
  };
  const openAddModal = () => { setEditingRoom(null); setFormData({ name: '', capacity: '', inclusions: '' }); setShowFormModal(true); };
  const closeFormModal = () => { setShowFormModal(false); setEditingRoom(null); setFormData({ name: '', capacity: '', inclusions: '' }); };
  const openViewModal = (room) => { setSelectedRoom(room); setShowViewModal(true); };
  const closeViewModal = () => { setShowViewModal(false); setSelectedRoom(null); };

  const filteredRooms = rooms.filter(room => room.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getSchedulesByStatus = (status) => {
    if (status === 'total') return schedules;
    return schedules.filter(s => s.status === status);
  };

  const applyFiltersAndSort = (data) => {
    let result = [...data];
    if (scheduleSearch) {
      const search = scheduleSearch.toLowerCase();
      result = result.filter(s => s.clientName.toLowerCase().includes(search) || s.room.toLowerCase().includes(search) || s.purpose.toLowerCase().includes(search));
    }
    if (roomFilter !== 'all') {
      result = result.filter(s => s.room === roomFilter);
    }
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') comparison = new Date(a.date) - new Date(b.date);
      else if (sortBy === 'client') comparison = a.clientName.localeCompare(b.clientName);
      else if (sortBy === 'room') comparison = a.room.localeCompare(b.room);
      else if (sortBy === 'guests') comparison = a.guests - b.guests;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return result;
  };

  const filteredSchedules = selectedFilter ? applyFiltersAndSort(getSchedulesByStatus(selectedFilter)) : [];
  const uniqueRooms = [...new Set(schedules.map(s => s.room))];

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      upcoming: 'bg-amber-100 text-amber-700',
      ongoing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return styles[status] || '';
  };

  const statCards = [
    { key: 'total', icon: '📊', label: 'Total', color: 'border-l-teal-600', iconBg: 'from-cyan-50 to-cyan-100' },
    { key: 'upcoming', icon: '📅', label: 'Upcoming', color: 'border-l-amber-500', iconBg: 'from-amber-100 to-amber-200' },
    { key: 'ongoing', icon: '▶️', label: 'Ongoing', color: 'border-l-blue-500', iconBg: 'from-blue-100 to-blue-200' },
    { key: 'pending', icon: '⏳', label: 'Pending', color: 'border-l-yellow-500', iconBg: 'from-yellow-100 to-yellow-200' },
    { key: 'completed', icon: '✅', label: 'Completed', color: 'border-l-green-500', iconBg: 'from-green-100 to-green-200' },
    { key: 'rejected', icon: '❌', label: 'Rejected', color: 'border-l-red-500', iconBg: 'from-red-100 to-red-200' },
  ];

  return (
    <div className="max-w-6xl">
      <h1 className="text-slate-800 text-3xl font-bold mb-6">Meeting Room</h1>
      
      <div className="flex gap-1 mb-6 border-b-2 border-gray-200">
        {['rooms', 'requests', 'schedule'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3.5 text-sm font-medium transition-all border-b-[3px] -mb-0.5 ${activeTab === tab ? 'text-slate-800 border-teal-600' : 'text-gray-500 border-transparent hover:text-slate-800 hover:bg-slate-800/5'}`}>
            {tab === 'rooms' ? 'Meeting Rooms' : tab === 'requests' ? 'Request List' : 'Schedule'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-7 shadow-lg shadow-slate-800/5 border border-gray-200">
        {activeTab === 'rooms' && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center gap-4">
              <input type="text" placeholder="Search rooms..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 max-w-xs px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" />
              <button onClick={openAddModal} className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/40 transition-all">+ Add Room</button>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
              {filteredRooms.length === 0 ? (
                <p className="text-gray-500 text-center py-10 col-span-full">{searchTerm ? 'No rooms found.' : 'No rooms created yet.'}</p>
              ) : (
                filteredRooms.map((room) => (
                  <div key={room.id} onClick={() => openViewModal(room)} className="bg-white rounded-2xl overflow-hidden cursor-pointer border border-gray-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-800/10 hover:border-transparent relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-slate-800 before:to-teal-600 before:opacity-0 hover:before:opacity-100 before:transition-opacity">
                    <div className="relative w-full h-44">
                      <Image src={room.image} alt={room.name} fill className="object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    <div className="p-4 pt-3">
                      <div className="text-slate-800 font-bold text-lg mb-2">{room.name}</div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm"><span className="text-teal-600">👥</span><span>{room.capacity} people</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="text-center py-16">
            <h2 className="text-slate-800 text-xl font-semibold mb-3">Request List</h2>
            <p className="text-gray-500">No pending requests.</p>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-6 gap-4">
              {statCards.map(card => (
                <div key={card.key} onClick={() => setSelectedFilter(card.key)} className={`bg-white rounded-xl p-4 flex items-center gap-3 border border-gray-200 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-800/10 border-l-[3px] ${card.color} ${selectedFilter === card.key ? 'ring-2 ring-teal-600 shadow-lg shadow-teal-600/20 -translate-y-0.5' : ''}`}>
                  <div className={`text-2xl w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${card.iconBg} shrink-0`}>{card.icon}</div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-2xl font-bold text-slate-800">{card.key === 'total' ? schedules.length : schedules.filter(s => s.status === card.key).length}</span>
                    <span className="text-xs text-gray-500 font-medium">{card.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {selectedFilter && (
              <div className="mt-6 bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <h3 className="text-slate-800 text-lg font-semibold whitespace-nowrap">{selectedFilter === 'total' ? 'All Reservations' : `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Reservations`}</h3>
                  <div className="flex gap-2.5 items-center ml-auto">
                    <input type="text" placeholder="Search..." value={scheduleSearch} onChange={(e) => setScheduleSearch(e.target.value)} className="flex-1 min-w-[150px] max-w-[220px] px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-600" />
                    <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white cursor-pointer focus:outline-none focus:border-teal-600">
                      <option value="all">All Rooms</option>
                      {uniqueRooms.map(room => <option key={room} value={room}>{room}</option>)}
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white cursor-pointer focus:outline-none focus:border-teal-600">
                      <option value="date">Sort by Date</option>
                      <option value="client">Sort by Client</option>
                      <option value="room">Sort by Room</option>
                      <option value="guests">Sort by Guests</option>
                    </select>
                    <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="w-9 h-9 border border-teal-600 rounded-lg bg-teal-50 text-teal-600 font-bold flex items-center justify-center hover:bg-teal-600 hover:text-white transition-all">{sortOrder === 'asc' ? '▲' : '▼'}</button>
                    <button onClick={() => { setSelectedFilter(null); setScheduleSearch(''); setRoomFilter('all'); }} className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white hover:bg-gray-100 whitespace-nowrap">Clear Filter</button>
                  </div>
                </div>
                {filteredSchedules.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">No reservations found.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-[1.2fr_1fr_0.9fr_1.1fr_0.6fr_1fr_0.8fr] gap-3 px-4 py-3 bg-slate-800 text-white rounded-lg text-xs font-semibold uppercase tracking-wide">
                      <span>Client</span><span>Room</span><span>Date</span><span>Time</span><span>Guests</span><span>Purpose</span><span>Status</span>
                    </div>
                    {filteredSchedules.map((schedule) => (
                      <div key={schedule.id} className="grid grid-cols-[1.2fr_1fr_0.9fr_1.1fr_0.6fr_1fr_0.8fr] gap-3 px-4 py-3.5 bg-white rounded-lg text-sm text-gray-600 items-center border border-gray-200 hover:shadow-lg hover:shadow-slate-800/10 hover:border-teal-600 transition-all">
                        <span className="text-slate-800 font-semibold">{schedule.clientName}</span>
                        <span>{schedule.room}</span>
                        <span>{schedule.date}</span>
                        <span>{schedule.time}</span>
                        <span>{schedule.guests}</span>
                        <span>{schedule.purpose}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize text-center ${getStatusBadge(schedule.status)}`}>{schedule.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease]" onClick={closeFormModal}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
              <h2 className="text-slate-800 text-xl font-bold">{editingRoom ? 'Edit Room' : 'Add New Room'}</h2>
              <button onClick={closeFormModal} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 hover:text-slate-800 transition-all">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Name of Room</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter room name" required className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" />
              </div>
              <div className="mb-5">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Maximum Capacity</label>
                <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} placeholder="Enter max capacity" min="1" required className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" />
              </div>
              <div className="mb-5">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Inclusions</label>
                <textarea name="inclusions" value={formData.inclusions} onChange={handleChange} placeholder="e.g. Projector, Whiteboard" rows="3" className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all resize-none" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={closeFormModal} className="px-7 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed">{loading ? 'Saving...' : editingRoom ? 'Update' : 'Add Room'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedRoom && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease]" onClick={closeViewModal}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
              <h2 className="text-slate-800 text-xl font-bold">Room Details</h2>
              <div className="flex items-center gap-1">
                <button onClick={handleEdit} title="Edit" className="p-2 bg-gray-100 rounded-lg text-lg hover:bg-gray-200 hover:scale-110 transition-all">✏️</button>
                <button onClick={handleDelete} title="Delete" className="p-2 bg-red-50 rounded-lg text-lg hover:bg-red-100 hover:scale-110 transition-all">🗑️</button>
                <button onClick={closeViewModal} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 hover:text-slate-800 transition-all ml-2">×</button>
              </div>
            </div>
            <div className="relative w-full h-56 rounded-xl overflow-hidden mb-6 shadow-lg">
              <Image src={selectedRoom.image} alt={selectedRoom.name} fill className="object-cover" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Room Name</span>
                <span className="text-slate-800 text-lg font-semibold">{selectedRoom.name}</span>
              </div>
              <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Maximum Capacity</span>
                <span className="text-slate-800 text-lg font-semibold">{selectedRoom.capacity} people</span>
              </div>
              <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Inclusions</span>
                <span className="text-slate-800 text-lg font-semibold">{selectedRoom.inclusions || 'None'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
