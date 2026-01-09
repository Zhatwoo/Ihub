'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

export default function PrivateOffice() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [rooms, setRooms] = useState([]);
  const [schedules, setSchedules] = useState([]);
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fetch rooms from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomsData);
    });
    return () => unsubscribe();
  }, []);

  // Fetch schedules from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'schedules'), (snapshot) => {
      const schedulesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchedules(schedulesData);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', imageFile);
      const response = await fetch('/api/upload', { method: 'POST', body: formDataUpload });
      const data = await response.json();
      if (data.success) return data.path;
      throw new Error(data.error);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imagePath = editingRoom?.image || '/rooms/default.png';
      if (imageFile) {
        const uploadedPath = await uploadImage();
        if (uploadedPath) imagePath = uploadedPath;
      }
      const roomData = { name: formData.name, capacity: parseInt(formData.capacity), inclusions: formData.inclusions, image: imagePath };
      if (editingRoom) {
        await updateDoc(doc(db, 'rooms', editingRoom.id), roomData);
      } else {
        await addDoc(collection(db, 'rooms'), roomData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', capacity: '', inclusions: '' });
    setImageFile(null);
    setImagePreview(null);
    setEditingRoom(null);
    setShowFormModal(false);
  };

  const handleEdit = () => {
    setShowViewModal(false);
    setEditingRoom(selectedRoom);
    setFormData({ name: selectedRoom.name, capacity: selectedRoom.capacity.toString(), inclusions: selectedRoom.inclusions || '' });
    setImagePreview(selectedRoom.image);
    setShowFormModal(true);
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;
    if (confirm('Delete this office?')) {
      try {
        await deleteDoc(doc(db, 'rooms', selectedRoom.id));
        setShowViewModal(false);
        setSelectedRoom(null);
      } catch (error) {
        console.error('Error deleting office:', error);
        alert('Failed to delete office');
      }
    }
  };

  const openAddModal = () => { setEditingRoom(null); setFormData({ name: '', capacity: '', inclusions: '' }); setImageFile(null); setImagePreview(null); setShowFormModal(true); };
  const closeFormModal = () => resetForm();
  const openViewModal = (room) => { setSelectedRoom(room); setShowViewModal(true); };
  const closeViewModal = () => { setShowViewModal(false); setSelectedRoom(null); };

  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, 'schedules', id), { status: 'upcoming' });
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await updateDoc(doc(db, 'schedules', id), { status: 'rejected' });
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const filteredRooms = rooms.filter(room => room.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getSchedulesByStatus = (status) => {
    if (status === 'total') return schedules;
    return schedules.filter(s => s.status === status);
  };

  const applyFiltersAndSort = (data) => {
    let result = [...data];
    if (scheduleSearch) {
      const search = scheduleSearch.toLowerCase();
      result = result.filter(s => s.clientName?.toLowerCase().includes(search) || s.room?.toLowerCase().includes(search) || s.purpose?.toLowerCase().includes(search));
    }
    if (roomFilter !== 'all') {
      result = result.filter(s => s.room === roomFilter);
    }
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') comparison = new Date(a.date) - new Date(b.date);
      else if (sortBy === 'client') comparison = (a.clientName || '').localeCompare(b.clientName || '');
      else if (sortBy === 'room') comparison = (a.room || '').localeCompare(b.room || '');
      else if (sortBy === 'guests') comparison = (a.guests || 0) - (b.guests || 0);
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
      ongoing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return styles[status] || '';
  };

  const statCards = [
    { key: 'total', icon: '📊', label: 'Total', color: 'border-l-teal-600', iconBg: 'from-cyan-50 to-cyan-100', ring: 'ring-teal-600 shadow-teal-600/20' },
    { key: 'upcoming', icon: '📅', label: 'Upcoming', color: 'border-l-teal-500', iconBg: 'from-teal-100 to-teal-200', ring: 'ring-teal-500 shadow-teal-500/20' },
    { key: 'ongoing', icon: '▶️', label: 'Ongoing', color: 'border-l-blue-500', iconBg: 'from-blue-100 to-blue-200', ring: 'ring-blue-500 shadow-blue-500/20' },
    { key: 'pending', icon: '⏳', label: 'Pending', color: 'border-l-yellow-500', iconBg: 'from-yellow-100 to-yellow-200', ring: 'ring-yellow-500 shadow-yellow-500/20' },
    { key: 'completed', icon: '✅', label: 'Completed', color: 'border-l-green-500', iconBg: 'from-green-100 to-green-200', ring: 'ring-green-500 shadow-green-500/20' },
    { key: 'rejected', icon: '❌', label: 'Rejected', color: 'border-l-red-500', iconBg: 'from-red-100 to-red-200', ring: 'ring-red-500 shadow-red-500/20' },
  ];

  return (
    <div className="max-w-6xl">
      <h1 className="text-slate-800 text-3xl font-bold mb-6">Private Office</h1>
      
      <div className="flex gap-1 mb-6 border-b-2 border-gray-200">
        {['rooms', 'requests', 'schedule'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3.5 text-sm font-medium transition-all border-b-[3px] -mb-0.5 ${activeTab === tab ? 'text-slate-800 border-teal-600' : 'text-gray-500 border-transparent hover:text-slate-800 hover:bg-slate-800/5'}`}>
            {tab === 'rooms' ? 'Private Offices' : tab === 'requests' ? 'Request List' : 'Schedule'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-7 shadow-lg shadow-slate-800/5 border border-gray-200">
        {activeTab === 'rooms' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex justify-between items-center gap-4">
              <input type="text" placeholder="Search offices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 max-w-xs px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" />
              <button onClick={openAddModal} className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/40 transition-all">+ Add Office</button>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
              {filteredRooms.length === 0 ? (
                <p className="text-gray-500 text-center py-10 col-span-full">{searchTerm ? 'No offices found.' : 'No offices created yet.'}</p>
              ) : (
                filteredRooms.map((room) => (
                  <div key={room.id} onClick={() => openViewModal(room)} className="bg-white rounded-2xl overflow-hidden cursor-pointer border border-gray-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-800/10 hover:border-transparent relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-slate-800 before:to-teal-600 before:opacity-0 hover:before:opacity-100 before:transition-opacity">
                    <div className="relative w-full h-44 bg-gray-100">
                      {room.image ? (
                        <Image src={room.image} alt={room.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">🏢</div>
                      )}
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
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-slate-800 text-xl font-bold">Pending Requests</h2>
                <p className="text-gray-500 text-sm mt-0.5">Review and manage reservation requests</p>
              </div>
              <span className="px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-sm font-semibold">{schedules.filter(s => s.status === 'pending').length} pending</span>
            </div>
            
            {schedules.filter(s => s.status === 'pending').length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="text-slate-800 font-semibold text-lg">No Pending Requests</p>
                <p className="text-gray-500 text-sm mt-1">All reservation requests have been processed</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Date Requested</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Office</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Date & Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Guests</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Purpose</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {schedules.filter(s => s.status === 'pending').map((request) => (
                      <tr key={request.id} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                        <td className="px-4 py-4">
                          <p className="text-slate-800 font-semibold">{request.clientName}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-gray-500 text-sm">{new Date(request.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-slate-800 font-medium">{request.room}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-slate-800 font-medium">{request.date}</p>
                          <p className="text-gray-500 text-sm">{request.time}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-slate-800 font-medium">{request.guests}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-slate-800">{request.purpose}</p>
                          {request.specialRequest && <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[150px]" title={request.specialRequest}>{request.specialRequest}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleApprove(request.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors">Approve</button>
                            <button onClick={() => handleReject(request.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors">Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="grid grid-cols-6 gap-4">
              {statCards.map(card => (
                <div key={card.key} onClick={() => setSelectedFilter(card.key)} className={`bg-white rounded-xl p-4 flex items-center gap-3 border border-gray-200 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-800/10 border-l-[3px] ${card.color} ${selectedFilter === card.key ? `ring-2 ${card.ring} -translate-y-0.5` : ''}`}>
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
                      <option value="all">All Offices</option>
                      {uniqueRooms.map(room => <option key={room} value={room}>{room}</option>)}
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white cursor-pointer focus:outline-none focus:border-teal-600">
                      <option value="date">Sort by Date</option>
                      <option value="client">Sort by Client</option>
                      <option value="room">Sort by Office</option>
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
                      <span>Client</span><span>Office</span><span>Date</span><span>Time</span><span>Guests</span><span>Purpose</span><span>Status</span>
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
              <h2 className="text-slate-800 text-xl font-bold">{editingRoom ? 'Edit Office' : 'Add New Office'}</h2>
              <button onClick={closeFormModal} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 hover:text-slate-800 transition-all">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Office Image</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-teal-600 transition-all cursor-pointer" onClick={() => document.getElementById('imageInput').click()}>
                  {imagePreview ? (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600">×</button>
                    </div>
                  ) : (
                    <div className="py-6">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-gray-500 text-sm">Click to upload image</p>
                      <p className="text-gray-400 text-xs mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                  <input type="file" id="imageInput" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Name of Office</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter office name" required className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" />
              </div>
              <div className="mb-5">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Maximum Capacity</label>
                <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} onWheel={(e) => e.target.blur()} placeholder="Enter max capacity" min="1" required className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" />
              </div>
              <div className="mb-5">
                <label className="block text-slate-800 mb-2 font-semibold text-sm">Inclusions</label>
                <textarea name="inclusions" value={formData.inclusions} onChange={handleChange} placeholder="e.g. Projector, Whiteboard" rows="3" className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all resize-none" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={closeFormModal} className="px-7 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" disabled={loading || uploading} className="flex-1 py-3.5 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed">{loading || uploading ? 'Saving...' : editingRoom ? 'Update' : 'Add Office'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedRoom && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease]" onClick={closeViewModal}>
          <div className="bg-white rounded-2xl p-7 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-100">
              <h2 className="text-slate-800 text-xl font-bold">Office Details</h2>
              <div className="flex items-center gap-1">
                <button onClick={handleEdit} title="Edit" className="p-2 bg-gray-100 rounded-lg text-lg hover:bg-gray-200 hover:scale-110 transition-all">✏️</button>
                <button onClick={handleDelete} title="Delete" className="p-2 bg-red-50 rounded-lg text-lg hover:bg-red-100 hover:scale-110 transition-all">🗑️</button>
                <button onClick={closeViewModal} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 hover:text-slate-800 transition-all ml-2">×</button>
              </div>
            </div>
            <div className="relative w-full h-56 rounded-xl overflow-hidden mb-6 shadow-lg bg-gray-100">
              {selectedRoom.image ? (
                <Image src={selectedRoom.image} alt={selectedRoom.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">🏢</div>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Office Name</span>
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

