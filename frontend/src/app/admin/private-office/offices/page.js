'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { api } from '@/lib/api';

export default function PrivateOffices() {
  const [rooms, setRooms] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({ name: '', rentFee: '', currency: 'PHP', rentFeePeriod: 'per hour', description: '', inclusions: '', status: 'Vacant' });
  const [searchTerm, setSearchTerm] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

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

  // Mount state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch rooms from API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/api/rooms');
        if (response.success && response.data) {
          setRooms(response.data);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };
    fetchRooms();
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
      showToast('Failed to upload image', 'error');
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
      const roomData = { 
        name: formData.name, 
        rentFee: parseFloat(formData.rentFee), 
        currency: formData.currency, 
        rentFeePeriod: formData.rentFeePeriod, 
        description: formData.description, 
        inclusions: formData.inclusions, 
        status: formData.status || 'Vacant', // Default to Vacant
        image: imagePath 
      };
      
      if (editingRoom) {
        const response = await api.put(`/api/rooms/${editingRoom.id}`, roomData);
        if (response.success) {
          showToast('Office updated successfully!', 'success');
          // Refresh rooms
          const roomsResponse = await api.get('/api/rooms');
          if (roomsResponse.success && roomsResponse.data) {
            setRooms(roomsResponse.data);
          }
        } else {
          showToast(response.message || 'Failed to update office', 'error');
        }
      } else {
        const response = await api.post('/api/rooms', roomData);
        if (response.success) {
          showToast('Office added successfully!', 'success');
          // Refresh rooms
          const roomsResponse = await api.get('/api/rooms');
          if (roomsResponse.success && roomsResponse.data) {
            setRooms(roomsResponse.data);
          }
        } else {
          showToast(response.message || 'Failed to add office', 'error');
        }
      }
      resetForm();
    } catch (error) {
      console.error('Error saving room:', error);
      showToast('Failed to save office', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', rentFee: '', currency: 'PHP', rentFeePeriod: 'per hour', description: '', inclusions: '', status: 'Vacant' });
    setImageFile(null);
    setImagePreview(null);
    setEditingRoom(null);
    setShowFormModal(false);
  };

  const handleEdit = () => {
    setShowViewModal(false);
    setEditingRoom(selectedRoom);
    setFormData({ 
      name: selectedRoom.name, 
      rentFee: selectedRoom.rentFee?.toString() || '', 
      currency: selectedRoom.currency || 'PHP', 
      rentFeePeriod: selectedRoom.rentFeePeriod || 'per hour', 
      description: selectedRoom.description || '', 
      inclusions: selectedRoom.inclusions || '',
      status: selectedRoom.status || 'Vacant'
    });
    setImagePreview(selectedRoom.image);
    setShowFormModal(true);
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;
    setConfirmAction(() => async () => {
      try {
        const response = await api.delete(`/api/rooms/${selectedRoom.id}`);
        if (response.success) {
          setShowViewModal(false);
          setSelectedRoom(null);
          showToast('Office deleted successfully!', 'success');
          // Refresh rooms
          const roomsResponse = await api.get('/api/rooms');
          if (roomsResponse.success && roomsResponse.data) {
            setRooms(roomsResponse.data);
          }
        } else {
          showToast(response.message || 'Failed to delete office', 'error');
        }
      } catch (error) {
        console.error('Error deleting office:', error);
        showToast('Failed to delete office', 'error');
      }
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
  };

  const openAddModal = () => { 
    setEditingRoom(null); 
    setFormData({ name: '', rentFee: '', currency: 'PHP', rentFeePeriod: 'per hour', description: '', inclusions: '', status: 'Vacant' }); 
    setImageFile(null); 
    setImagePreview(null); 
    setShowFormModal(true); 
  };
  
  const closeFormModal = () => resetForm();
  const openViewModal = (room) => { setSelectedRoom(room); setShowViewModal(true); };
  const closeViewModal = () => { setShowViewModal(false); setSelectedRoom(null); };

  // Fetch filtered rooms from backend
  const [filteredRooms, setFilteredRooms] = useState([]);

  useEffect(() => {
    const filterRooms = async () => {
      if (!searchTerm) {
        setFilteredRooms(rooms);
        return;
      }

      try {
        const response = await api.get(`/api/rooms?search=${encodeURIComponent(searchTerm)}`);
        if (response.success && response.data) {
          setFilteredRooms(response.data);
        }
      } catch (error) {
        console.error('Error filtering rooms:', error);
        setFilteredRooms(rooms);
      }
    };

    filterRooms();
  }, [searchTerm, rooms]);

  return (
    <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3">
        <input 
          type="text" 
          placeholder="Search offices..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="flex-1 w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" 
        />
        <button 
          onClick={openAddModal} 
          className="w-full sm:w-auto px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/40 transition-all whitespace-nowrap"
        >
          + Add Office
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
        {filteredRooms.length === 0 ? (
          <p className="text-gray-500 text-center py-10 col-span-full">
            {searchTerm ? 'No offices found.' : 'No offices created yet.'}
          </p>
        ) : (
          filteredRooms.map((room) => (
            <div 
              key={room.id} 
              onClick={() => openViewModal(room)} 
              className="bg-white rounded-2xl overflow-hidden cursor-pointer border border-gray-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-800/10 hover:border-transparent relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-slate-800 before:to-teal-600 before:opacity-0 hover:before:opacity-100 before:transition-opacity"
            >
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
                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-2">
                  <span className="text-teal-600">💰</span>
                  <span>{getCurrencySymbol(room.currency || 'PHP')}{room.rentFee?.toLocaleString() || '0'} {room.rentFeePeriod || 'per hour'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    room.status === 'Occupied' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {room.status || 'Vacant'}
                  </span>
                  {room.status === 'Occupied' && room.occupiedBy && (
                    <span className="text-xs text-gray-500 truncate max-w-[100px]" title={room.occupiedBy}>
                      {room.occupiedBy}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showFormModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease] p-4" onClick={closeFormModal}>
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-100">
              <h2 className="text-slate-800 text-lg sm:text-xl font-bold">{editingRoom ? 'Edit Office' : 'Add New Office'}</h2>
              <div className="flex items-center gap-2">
                <button 
                  type="submit" 
                  form="office-form" 
                  disabled={loading || uploading} 
                  className="px-4 py-2 sm:py-2.5 bg-teal-600 text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || uploading ? 'Saving...' : editingRoom ? 'Update' : 'Add Office'}
                </button>
                <button 
                  onClick={closeFormModal} 
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg sm:text-xl hover:bg-gray-200 hover:text-slate-800 transition-all"
                >
                  ×
                </button>
              </div>
            </div>
            <form id="office-form" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Column 1 */}
                <div className="flex flex-col gap-4 sm:gap-5">
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-sm">Office Image</label>
                    <div 
                      className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-teal-600 transition-all cursor-pointer"
                      onClick={() => document.getElementById('imageInput').click()}
                    >
                      {imagePreview ? (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden">
                          <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }} 
                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="py-4">
                          <div className="text-3xl mb-2">📷</div>
                          <p className="text-gray-500 text-sm">Click to upload</p>
                        </div>
                      )}
                      <input type="file" id="imageInput" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Name of Office</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      placeholder="Enter office name" 
                      required 
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Rent Fee</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <select 
                          name="currency" 
                          value={formData.currency} 
                          onChange={handleChange} 
                          className="w-24 px-2 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all cursor-pointer"
                        >
                          <option value="PHP">₱ PHP</option>
                          <option value="USD">$ USD</option>
                          <option value="EUR">€ EUR</option>
                          <option value="GBP">£ GBP</option>
                          <option value="JPY">¥ JPY</option>
                        </select>
                        <input 
                          type="number" 
                          name="rentFee" 
                          value={formData.rentFee} 
                          onChange={handleChange} 
                          onWheel={(e) => e.target.blur()} 
                          placeholder="Amount" 
                          min="0" 
                          step="0.01" 
                          required 
                          className="flex-1 px-3 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" 
                        />
                      </div>
                      <select 
                        name="rentFeePeriod" 
                        value={formData.rentFeePeriod} 
                        onChange={handleChange} 
                        className="w-full px-3 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="per hour">Per Hour</option>
                        <option value="per day">Per Day</option>
                        <option value="per month">Per Month</option>
                        <option value="per year">Per Year</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Status</label>
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleChange} 
                      className="w-full px-3 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                    </select>
                  </div>
                </div>
                {/* Column 2 */}
                <div className="flex flex-col gap-4 sm:gap-5">
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Description</label>
                    <textarea 
                      name="description" 
                      value={formData.description} 
                      onChange={handleChange} 
                      placeholder="Enter office description" 
                      rows="6" 
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all resize-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Inclusions</label>
                    <textarea 
                      name="inclusions" 
                      value={formData.inclusions} 
                      onChange={handleChange} 
                      placeholder="e.g. Projector, Whiteboard, WiFi" 
                      rows="6" 
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all resize-none" 
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* View Modal */}
      {showViewModal && selectedRoom && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease] p-4" onClick={closeViewModal}>
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-100">
              <h2 className="text-slate-800 text-lg sm:text-xl font-bold">Office Details</h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleEdit} 
                  title="Edit" 
                  className="p-1.5 sm:p-2 bg-gray-100 rounded-lg text-base sm:text-lg hover:bg-gray-200 hover:scale-110 transition-all"
                >
                  ✏️
                </button>
                <button 
                  onClick={handleDelete} 
                  title="Delete" 
                  className="p-1.5 sm:p-2 bg-red-50 rounded-lg text-base sm:text-lg hover:bg-red-100 hover:scale-110 transition-all"
                >
                  🗑️
                </button>
                <button 
                  onClick={closeViewModal} 
                  className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg sm:text-xl hover:bg-gray-200 hover:text-slate-800 transition-all ml-1 sm:ml-2"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Left Column */}
              <div className="flex flex-col gap-4 sm:gap-5">
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-sm">Office Image</label>
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                    {selectedRoom.image ? (
                      <Image src={selectedRoom.image} alt={selectedRoom.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">🏢</div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-sm">Name of Office</label>
                  <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50">
                    {selectedRoom.name}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-sm">Rent Fee</label>
                  <div className="flex flex-col gap-2">
                    <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50">
                      {getCurrencySymbol(selectedRoom.currency || 'PHP')}{selectedRoom.rentFee?.toLocaleString() || '0'}
                    </div>
                    <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50">
                      {selectedRoom.rentFeePeriod || 'per hour'}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-sm">Status</label>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-2 rounded-xl text-sm font-semibold ${
                      selectedRoom.status === 'Occupied' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedRoom.status || 'Vacant'}
                    </span>
                    {selectedRoom.status === 'Occupied' && selectedRoom.occupiedBy && (
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Occupied by:</div>
                        <div className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50">
                          {selectedRoom.occupiedBy}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="flex flex-col gap-4 sm:gap-5">
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-sm">Description</label>
                  <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 min-h-[150px] whitespace-pre-line">
                    {selectedRoom.description || 'No description available'}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-sm">Inclusions</label>
                  <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 min-h-[150px] whitespace-pre-line">
                    {selectedRoom.inclusions || 'No inclusions specified'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {toast.show && mounted && createPortal(
        <div className="fixed top-6 right-6 z-[10000] animate-[slideInRight_0.3s_ease]">
          <div className={`px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md ${
            toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
            : toast.type === 'success' ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              toast.type === 'error' ? 'bg-red-400/30' : toast.type === 'success' ? 'bg-teal-400/30' : 'bg-blue-400/30'
            }`}>
              <span className="text-lg font-bold">{toast.type === 'error' ? '✕' : toast.type === 'success' ? '✓' : 'ℹ'}</span>
            </div>
            <span className="font-medium flex-1 text-sm sm:text-base">{toast.message}</span>
            <button 
              onClick={() => setToast({ show: false, message: '', type: 'success' })} 
              className="ml-2 text-white/80 hover:text-white text-xl font-bold transition-colors flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20"
            >
              ×
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10001] animate-[fadeIn_0.2s_ease] p-4" onClick={() => { setShowConfirmDialog(false); setConfirmAction(null); }}>
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Delete Office</h3>
                <p className="text-sm text-gray-600">Are you sure you want to delete this office? This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowConfirmDialog(false); setConfirmAction(null); }} 
                className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-200 text-slate-800 font-medium rounded-xl hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => { if (confirmAction) confirmAction(); }} 
                className="flex-1 px-4 py-2.5 sm:py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}