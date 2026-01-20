'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { api } from '@/lib/api';

export default function PrivateOffice() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [rooms, setRooms] = useState([]);
  const [mounted, setMounted] = useState(false);
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
  const [formData, setFormData] = useState({ name: '', rentFee: '', currency: 'PHP', rentFeePeriod: 'per hour', description: '', inclusions: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmDialogData, setConfirmDialogData] = useState({ type: '', title: '', message: '' });
  const [showEditTenantModal, setShowEditTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [tenantFormData, setTenantFormData] = useState({
    clientName: '',
    email: '',
    contactNumber: '',
    room: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    notes: '',
    status: 'approved'
  });
  
  // Use refs to track intervals and prevent multiple intervals
  const roomsIntervalRef = useRef(null);
  const schedulesIntervalRef = useRef(null);

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

  // Fetch rooms from backend
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
    
    // Poll for updates every 30 seconds, only when tab is visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (roomsIntervalRef.current) {
          clearInterval(roomsIntervalRef.current);
          roomsIntervalRef.current = null;
        }
      } else {
        // Only create interval if one doesn't already exist
        if (!roomsIntervalRef.current) {
          roomsIntervalRef.current = setInterval(fetchRooms, 30000);
        }
      }
    };
    
    // Start polling if tab is visible
    if (!document.hidden && !roomsIntervalRef.current) {
      roomsIntervalRef.current = setInterval(fetchRooms, 30000);
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (roomsIntervalRef.current) {
        clearInterval(roomsIntervalRef.current);
        roomsIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch schedules from backend with real-time updates
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await api.get('/api/schedules');
        if (response.success && response.data) {
          // Filter for private room bookings only
          const privateOfficeBookings = response.data.filter(
            schedule => schedule.requestType === 'privateroom' || 
                       (!schedule.requestType && schedule.room && schedule.roomId) // Backwards compatibility
          );
          setSchedules(privateOfficeBookings);
        }
      } catch (error) {
        console.error('Error fetching schedules:', error);
      }
    };

    // Initial fetch
    fetchSchedules();
    
    // Poll for updates every 30 seconds (reduced from 2 seconds to prevent excessive API calls)
    // Only poll when tab is visible to reduce unnecessary requests
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (schedulesIntervalRef.current) {
          clearInterval(schedulesIntervalRef.current);
          schedulesIntervalRef.current = null;
        }
      } else {
        // Only create interval if one doesn't already exist
        if (!schedulesIntervalRef.current) {
          fetchSchedules(); // Fetch immediately when tab becomes visible
          schedulesIntervalRef.current = setInterval(fetchSchedules, 30000);
        }
      }
    };
    
    // Start polling if tab is visible (only if no interval exists)
    if (!document.hidden && !schedulesIntervalRef.current) {
      schedulesIntervalRef.current = setInterval(fetchSchedules, 30000);
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (schedulesIntervalRef.current) {
        clearInterval(schedulesIntervalRef.current);
        schedulesIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
      const response = await api.upload('/api/upload', formDataUpload);
      if (response.success) return response.path;
      throw new Error(response.error);
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
      const roomData = { name: formData.name, rentFee: parseFloat(formData.rentFee), currency: formData.currency, rentFeePeriod: formData.rentFeePeriod, description: formData.description, inclusions: formData.inclusions, image: imagePath };
      
      let response;
      if (editingRoom) {
        response = await api.put(`/api/rooms/${editingRoom.id}`, roomData);
      } else {
        response = await api.post('/api/rooms', roomData);
      }
      
      if (response.success) {
        showToast(editingRoom ? 'Room updated successfully!' : 'Room added successfully!', 'success');
        // Refresh rooms list
        const roomsResponse = await api.get('/api/rooms');
        if (roomsResponse.success && roomsResponse.data) {
          setRooms(roomsResponse.data);
        }
        resetForm();
      } else {
        showToast(response.message || 'Failed to save room', 'error');
      }
    } catch (error) {
      console.error('Error saving room:', error);
      showToast(error.message || 'Failed to save room', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', rentFee: '', currency: 'PHP', rentFeePeriod: 'per hour', description: '', inclusions: '' });
    setImageFile(null);
    setImagePreview(null);
    setEditingRoom(null);
    setShowFormModal(false);
  };

  const handleEdit = () => {
    setShowViewModal(false);
    setEditingRoom(selectedRoom);
    setFormData({ name: selectedRoom.name, rentFee: selectedRoom.rentFee?.toString() || '', currency: selectedRoom.currency || 'PHP', rentFeePeriod: selectedRoom.rentFeePeriod || 'per hour', description: selectedRoom.description || '', inclusions: selectedRoom.inclusions || '' });
    setImagePreview(selectedRoom.image);
    setShowFormModal(true);
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;
    setConfirmDialogData({
      type: 'office',
      title: 'Delete Office',
      message: `Are you sure you want to delete "${selectedRoom.name}"? This will permanently remove the office and all associated data. This action cannot be undone.`
    });
    setConfirmAction(() => async () => {
      try {
        setLoading(true);
        const response = await api.delete(`/api/rooms/${selectedRoom.id}`);
        
        if (response.success) {
          setShowViewModal(false);
          setSelectedRoom(null);
          showToast('Office deleted successfully!', 'success');
          // Refresh rooms list
          const roomsResponse = await api.get('/api/rooms');
          if (roomsResponse.success && roomsResponse.data) {
            setRooms(roomsResponse.data);
          }
        } else {
          showToast(response.message || 'Failed to delete office', 'error');
        }
      } catch (error) {
        console.error('Error deleting office:', error);
        showToast(error.message || 'Failed to delete office', 'error');
      } finally {
        setLoading(false);
        setShowConfirmDialog(false);
        setConfirmAction(null);
        setConfirmDialogData({ type: '', title: '', message: '' });
      }
    });
    setShowConfirmDialog(true);
  };

  const openAddModal = () => { setEditingRoom(null); setFormData({ name: '', rentFee: '', currency: 'PHP', rentFeePeriod: 'per hour', description: '', inclusions: '' }); setImageFile(null); setImagePreview(null); setShowFormModal(true); };
  const closeFormModal = () => resetForm();
  const openViewModal = (room) => { setSelectedRoom(room); setShowViewModal(true); };
  const closeViewModal = () => { setShowViewModal(false); setSelectedRoom(null); };

  const handleApprove = async (request) => {
    if (!confirm(`Are you sure you want to approve the booking request from ${request.clientName} for ${request.room}?`)) {
      return;
    }

    try {
      const response = await api.put(`/api/schedules/${request.id}`, { 
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: 'admin'
      });
      
      if (response.success) {
        // Immediately remove from UI (optimistic update)
        setSchedules(prevSchedules => prevSchedules.filter(s => s.id !== request.id));
        
        // Show success message
        showToast(`Booking request from ${request.clientName} has been approved!`, 'success');
        
        // Refresh schedules for consistency
        setTimeout(async () => {
          try {
            const schedulesResponse = await api.get('/api/schedules');
            if (schedulesResponse.success && schedulesResponse.data) {
              const privateOfficeBookings = schedulesResponse.data.filter(
                schedule => schedule.requestType === 'privateroom' || 
                           (!schedule.requestType && schedule.room && schedule.roomId)
              );
              setSchedules(privateOfficeBookings);
            }
          } catch (error) {
            console.error('Error refreshing schedules:', error);
          }
        }, 500);
      } else {
        showToast(response.message || 'Failed to approve request', 'error');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      showToast(error.message || 'Failed to approve request. Please try again.', 'error');
    }
  };

  // Edit tenant booking
  const openEditTenantModal = (tenant) => {
    setEditingTenant(tenant);
    setTenantFormData({
      clientName: tenant.clientName || '',
      email: tenant.email || '',
      contactNumber: tenant.contactNumber || '',
      room: tenant.room || '',
      startDate: tenant.startDate ? tenant.startDate.split('T')[0] : '',
      endDate: tenant.endDate ? tenant.endDate.split('T')[0] : '',
      startTime: tenant.startTime || '',
      endTime: tenant.endTime || '',
      notes: tenant.notes || '',
      status: tenant.status || 'approved'
    });
    setShowEditTenantModal(true);
  };

  const closeEditTenantModal = () => {
    setShowEditTenantModal(false);
    setEditingTenant(null);
    setTenantFormData({
      clientName: '',
      email: '',
      contactNumber: '',
      room: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      notes: '',
      status: 'approved'
    });
  };

  const handleUpdateTenant = async () => {
    if (!editingTenant) return;

    try {
      setLoading(true);
      const updateData = {
        ...tenantFormData,
        updatedAt: new Date().toISOString()
      };

      const response = await api.put(`/api/schedules/${editingTenant.id}`, updateData);
      
      if (response.success) {
        showToast(`Tenant booking for ${tenantFormData.clientName} has been updated!`, 'success');
        closeEditTenantModal();
        
        // Refresh schedules
        setTimeout(async () => {
          try {
            const schedulesResponse = await api.get('/api/schedules');
            if (schedulesResponse.success && schedulesResponse.data) {
              const privateOfficeBookings = schedulesResponse.data.filter(
                schedule => schedule.requestType === 'privateroom' || 
                           (!schedule.requestType && schedule.room && schedule.roomId)
              );
              setSchedules(privateOfficeBookings);
            }
          } catch (error) {
            console.error('Error refreshing schedules:', error);
          }
        }, 500);
      } else {
        showToast(response.message || 'Failed to update tenant booking', 'error');
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      showToast(error.message || 'Failed to update tenant booking. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete tenant booking
  const handleDeleteTenant = (tenant) => {
    setConfirmDialogData({
      type: 'tenant',
      title: 'Delete Tenant Booking',
      message: `Are you sure you want to delete the booking for ${tenant.clientName}? This will permanently remove their private office reservation. This action cannot be undone.`
    });
    setConfirmAction(async () => {
      try {
        setLoading(true);
        const response = await api.delete(`/api/schedules/${tenant.id}`);
        
        if (response.success) {
          // Immediately remove from UI (optimistic update)
          setSchedules(prevSchedules => prevSchedules.filter(s => s.id !== tenant.id));
          showToast(`Tenant booking for ${tenant.clientName} has been deleted!`, 'success');
          
          // Refresh schedules for consistency
          setTimeout(async () => {
            try {
              const schedulesResponse = await api.get('/api/schedules');
              if (schedulesResponse.success && schedulesResponse.data) {
                const privateOfficeBookings = schedulesResponse.data.filter(
                  schedule => schedule.requestType === 'privateroom' || 
                             (!schedule.requestType && schedule.room && schedule.roomId)
                );
                setSchedules(privateOfficeBookings);
              }
            } catch (error) {
              console.error('Error refreshing schedules:', error);
            }
          }, 500);
        } else {
          showToast(response.message || 'Failed to delete tenant booking', 'error');
        }
      } catch (error) {
        console.error('Error deleting tenant:', error);
        showToast(error.message || 'Failed to delete tenant booking. Please try again.', 'error');
      } finally {
        setLoading(false);
        setShowConfirmDialog(false);
        setConfirmAction(null);
        setConfirmDialogData({ type: '', title: '', message: '' });
      }
    });
    setShowConfirmDialog(true);
  };

  const handleReject = async (request) => {
    if (!confirm(`Are you sure you want to reject the booking request from ${request.clientName} for ${request.room}?`)) {
      return;
    }

    try {
      const response = await api.put(`/api/schedules/${request.id}`, { 
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: 'admin'
      });
      
      if (response.success) {
        // Immediately remove from UI (optimistic update)
        setSchedules(prevSchedules => prevSchedules.filter(s => s.id !== request.id));
        
        // Show success message
        showToast(`Booking request from ${request.clientName} has been rejected.`, 'success');
        
        // Refresh schedules for consistency
        setTimeout(async () => {
          try {
            const schedulesResponse = await api.get('/api/schedules');
            if (schedulesResponse.success && schedulesResponse.data) {
              const privateOfficeBookings = schedulesResponse.data.filter(
                schedule => schedule.requestType === 'privateroom' || 
                           (!schedule.requestType && schedule.room && schedule.roomId)
              );
              setSchedules(privateOfficeBookings);
            }
          } catch (error) {
            console.error('Error refreshing schedules:', error);
          }
        }, 500);
      } else {
        showToast(response.message || 'Failed to reject request', 'error');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      showToast(error.message || 'Failed to reject request. Please try again.', 'error');
    }
  };

  const filteredRooms = rooms.filter(room => room.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getSchedulesByStatus = (status) => {
    // All schedules are already filtered to private office bookings only
    if (status === 'total') return schedules;
    if (status === 'active') {
      // Active includes both upcoming and ongoing
      return schedules.filter(s => s.status === 'upcoming' || s.status === 'ongoing' || s.status === 'active' || s.status === 'approved');
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
    <div className="w-full animate-fadeIn">
      <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 animate-slideInLeft">Private Office</h1>
      
      <div className="flex flex-wrap gap-1 mb-4 sm:mb-6 border-b-2 border-gray-200">
        {['rooms', 'requests', 'tenants', 'schedule'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-medium transition-all border-b-[3px] -mb-0.5 whitespace-nowrap ${activeTab === tab ? 'text-slate-800 border-teal-600' : 'text-gray-500 border-transparent hover:text-slate-800 hover:bg-slate-800/5'}`}>
            {tab === 'rooms' ? 'Private Offices' : tab === 'requests' ? 'Request List' : tab === 'tenants' ? 'Tenants' : 'Schedule'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 xl:p-6 shadow-lg shadow-slate-800/5 border border-gray-200">
        {activeTab === 'rooms' && (
          <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3">
              <input type="text" placeholder="Search offices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" />
              <button onClick={openAddModal} className="w-full sm:w-auto px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-linear-to-r from-teal-600 to-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/40 transition-all whitespace-nowrap">+ Add Office</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {filteredRooms.length === 0 ? (
                <p className="text-gray-500 text-center py-10 col-span-full">{searchTerm ? 'No offices found.' : 'No offices created yet.'}</p>
              ) : (
                filteredRooms.map((room) => (
                  <div key={room.id} onClick={() => openViewModal(room)} className="bg-white rounded-2xl overflow-hidden cursor-pointer border border-gray-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-800/10 hover:border-transparent relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-linear-to-r before:from-slate-800 before:to-teal-600 before:opacity-0 hover:before:opacity-100 before:transition-opacity">
                    <div className="relative w-full h-44 bg-gray-100">
                      {room.image ? (
                        <Image src={room.image} alt={room.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">🏢</div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-black/40 to-transparent" />
                    </div>
                    <div className="p-4 pt-3">
                      <div className="text-slate-800 font-bold text-lg mb-2">{room.name}</div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm"><span className="text-teal-600">💰</span><span>{getCurrencySymbol(room.currency || 'PHP')}{room.rentFee?.toLocaleString() || '0'} {room.rentFeePeriod || 'per hour'}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-200 gap-3 sm:gap-0">
              <div>
                <h2 className="text-slate-800 text-lg sm:text-xl font-bold">Pending Requests</h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Review and manage reservation requests</p>
              </div>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap">
                {schedules.filter(s => s.status === 'pending' && (s.requestType === 'privateroom' || (!s.requestType && s.room && s.roomId))).length} pending
              </span>
            </div>
            
            {schedules.filter(s => s.status === 'pending' && (s.requestType === 'privateroom' || (!s.requestType && s.room && s.roomId))).length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="text-slate-800 font-semibold text-base sm:text-lg">No Pending Requests</p>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">All private office reservation requests have been processed</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <div className="min-w-full inline-block align-middle">
                  <table className="w-full min-w-[800px]">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Full Name</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Email</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Contact</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Office</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Start Date</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Requested</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {schedules.filter(s => s.status === 'pending' && (s.requestType === 'privateroom' || (!s.requestType && s.room && s.roomId))).map((request) => (
                      <tr key={request.id} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <p className="text-slate-800 font-semibold text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none" title={request.clientName}>{request.clientName}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <p className="text-gray-600 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none" title={request.email || 'N/A'}>{request.email || 'N/A'}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <p className="text-gray-600 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none" title={request.contactNumber || 'N/A'}>{request.contactNumber || 'N/A'}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <p className="text-slate-800 font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none" title={request.room}>{request.room}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <p className="text-slate-800 font-medium text-xs sm:text-sm whitespace-nowrap">
                            {request.startDate ? new Date(request.startDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <p className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">{new Date(request.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                            <button 
                              onClick={() => handleApprove(request)} 
                              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 text-white rounded-lg text-[10px] xs:text-xs font-semibold hover:bg-green-700 transition-colors whitespace-nowrap flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(request)} 
                              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 text-white rounded-lg text-[10px] xs:text-xs font-semibold hover:bg-red-700 transition-colors whitespace-nowrap flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tenants' && (
          <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-200 gap-3 sm:gap-0">
              <div>
                <h2 className="text-slate-800 text-lg sm:text-xl font-bold">Private Office Tenants</h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-0.5">View all active tenants with private office bookings</p>
              </div>
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap">
                {schedules.filter(s => (s.status === 'approved' || s.status === 'active' || s.status === 'ongoing' || s.status === 'upcoming') && (s.requestType === 'privateroom' || (!s.requestType && s.room && s.roomId))).length} active tenants
              </span>
            </div>

            {schedules.filter(s => (s.status === 'approved' || s.status === 'active' || s.status === 'ongoing' || s.status === 'upcoming') && (s.requestType === 'privateroom' || (!s.requestType && s.room && s.roomId))).length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <p className="text-slate-800 font-semibold text-base sm:text-lg">No Active Tenants</p>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">No tenants have active private office bookings yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <div className="min-w-full inline-block align-middle">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                      <tr>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Tenant Name</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Email</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Contact</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Office</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Start Date</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">End Date</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Time</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Status</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-[10px] xs:text-xs font-semibold uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {schedules
                        .filter(s => (s.status === 'approved' || s.status === 'active' || s.status === 'ongoing' || s.status === 'upcoming') && (s.requestType === 'privateroom' || (!s.requestType && s.room && s.roomId)))
                        .map((tenant) => (
                          <tr key={tenant.id} className="bg-white hover:bg-gray-50 transition-colors">
                            <td className="px-3 sm:px-4 py-3 sm:py-4">
                              <p className="text-slate-800 font-semibold text-xs sm:text-sm truncate max-w-[150px]" title={tenant.clientName}>
                                {tenant.clientName}
                              </p>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4">
                              <p className="text-gray-600 text-xs sm:text-sm truncate max-w-[180px]" title={tenant.email || 'N/A'}>
                                {tenant.email || 'N/A'}
                              </p>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4">
                              <p className="text-gray-600 text-xs sm:text-sm truncate max-w-[120px]" title={tenant.contactNumber || 'N/A'}>
                                {tenant.contactNumber || 'N/A'}
                              </p>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4">
                              <p className="text-slate-800 font-medium text-xs sm:text-sm truncate max-w-[120px]" title={tenant.room}>
                                {tenant.room}
                              </p>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4">
                              <p className="text-slate-800 font-medium text-xs sm:text-sm whitespace-nowrap">
                                {tenant.startDate ? new Date(tenant.startDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                }) : 'N/A'}
                              </p>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4">
                              <p className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">
                                {tenant.endDate ? new Date(tenant.endDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                }) : 'Ongoing'}
                              </p>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4">
                              <p className="text-gray-600 text-xs sm:text-sm whitespace-nowrap">
                                {tenant.startTime && tenant.endTime 
                                  ? `${tenant.startTime} - ${tenant.endTime}`
                                  : tenant.startTime 
                                  ? `${tenant.startTime} onwards`
                                  : 'All day'}
                              </p>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4">
                              <div className="flex justify-center">
                                <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] xs:text-xs font-semibold capitalize ${
                                  tenant.status === 'active' || tenant.status === 'ongoing' || tenant.status === 'approved'
                                    ? 'bg-teal-100 text-teal-700'
                                    : tenant.status === 'upcoming'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {tenant.status || 'active'}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 sm:py-4">
                              <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                                <button
                                  onClick={() => openEditTenantModal(tenant)}
                                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white rounded-lg text-[10px] xs:text-xs font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center gap-1"
                                  title="Edit tenant booking"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTenant(tenant)}
                                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 text-white rounded-lg text-[10px] xs:text-xs font-semibold hover:bg-red-700 transition-colors whitespace-nowrap flex items-center gap-1"
                                  title="Delete tenant booking"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 animate-fadeIn">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {statCards.map(card => (
                <div key={card.key} onClick={() => setSelectedFilter(card.key)} className={`bg-white rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 border border-gray-200 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-800/10 border-l-[3px] sm:border-l-4 ${card.color} ${selectedFilter === card.key ? `ring-2 ${card.ring} -translate-y-0.5 shadow-xl` : ''} overflow-hidden`}>
                  <div className={`text-lg sm:text-xl lg:text-2xl w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-linear-to-br ${card.iconBg} shrink-0 shadow-sm sm:shadow-md`}>{card.icon}</div>
                  <div className="flex flex-row items-baseline gap-1.5 sm:gap-2 flex-1 min-w-0 overflow-hidden">
                    <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 whitespace-nowrap shrink-0">
                      {card.key === 'total' ? schedules.length : 
                       card.key === 'active' ? schedules.filter(s => s.status === 'upcoming' || s.status === 'ongoing' || s.status === 'active').length :
                       schedules.filter(s => s.status === card.key).length}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 font-semibold wrap-break-word leading-tight uppercase tracking-wide flex-1 min-w-0 hyphens-auto">{card.label}</span>
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
                    <input type="text" placeholder="Search..." value={scheduleSearch} onChange={(e) => setScheduleSearch(e.target.value)} className="flex-1 min-w-[150px] max-w-[220px] px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-teal-600" />
                    <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white cursor-pointer focus:outline-none focus:border-teal-600">
                      <option value="all">All Offices</option>
                      {uniqueRooms.map(room => <option key={room} value={room}>{room}</option>)}
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white cursor-pointer focus:outline-none focus:border-teal-600">
                      <option value="date">Sort by Start Date</option>
                      <option value="client">Sort by Client</option>
                      <option value="room">Sort by Office</option>
                      <option value="email">Sort by Email</option>
                    </select>
                    <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="w-9 h-9 border border-teal-600 rounded-lg bg-teal-50 text-teal-600 font-bold flex items-center justify-center hover:bg-teal-600 hover:text-white transition-all">{sortOrder === 'asc' ? '▲' : '▼'}</button>
                    <button onClick={() => { setSelectedFilter(null); setScheduleSearch(''); setRoomFilter('all'); }} className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white hover:bg-gray-100 whitespace-nowrap">Clear Filter</button>
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
        )}
      </div>

      {showFormModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease] p-4" onClick={closeFormModal}>
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-100">
              <h2 className="text-slate-800 text-lg sm:text-xl font-bold">{editingRoom ? 'Edit Office' : 'Add New Office'}</h2>
              <div className="flex items-center gap-2">
                <button type="submit" form="office-form" disabled={loading || uploading} className="px-4 py-2 sm:py-2.5 bg-teal-600 text-white text-xs sm:text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{loading || uploading ? 'Saving...' : editingRoom ? 'Update' : 'Add Office'}</button>
                <button onClick={closeFormModal} className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg sm:text-xl hover:bg-gray-200 hover:text-slate-800 transition-all">×</button>
              </div>
            </div>
            <form id="office-form" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Column 1 */}
                <div className="flex flex-col gap-4 sm:gap-5">
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-sm">Office Image</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-teal-600 transition-all cursor-pointer" onClick={() => document.getElementById('imageInput').click()}>
                      {imagePreview ? (
                        <div className="relative w-full h-32 rounded-lg overflow-hidden">
                          <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                          <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600">×</button>
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
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter office name" required className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Rent Fee</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <select name="currency" value={formData.currency} onChange={handleChange} className="w-24 px-2 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all cursor-pointer">
                          <option value="PHP">₱ PHP</option>
                          <option value="USD">$ USD</option>
                          <option value="EUR">€ EUR</option>
                          <option value="GBP">£ GBP</option>
                          <option value="JPY">¥ JPY</option>
                        </select>
                        <input type="number" name="rentFee" value={formData.rentFee} onChange={handleChange} onWheel={(e) => e.target.blur()} placeholder="Amount" min="0" step="0.01" required className="flex-1 px-3 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all" />
                      </div>
                      <select name="rentFeePeriod" value={formData.rentFeePeriod} onChange={handleChange} className="w-full px-3 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all cursor-pointer">
                        <option value="per hour">Per Hour</option>
                        <option value="per day">Per Day</option>
                        <option value="per month">Per Month</option>
                        <option value="per year">Per Year</option>
                      </select>
                    </div>
                  </div>
                </div>
                {/* Column 2 */}
                <div className="flex flex-col gap-4 sm:gap-5">
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter office description" rows="6" className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all resize-none" />
                  </div>
                  <div>
                    <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Inclusions</label>
                    <textarea name="inclusions" value={formData.inclusions} onChange={handleChange} placeholder="e.g. Projector, Whiteboard, WiFi" rows="6" className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 transition-all resize-none" />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showViewModal && selectedRoom && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease] p-4" onClick={closeViewModal}>
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-100">
              <h2 className="text-slate-800 text-lg sm:text-xl font-bold">Office Details</h2>
              <div className="flex items-center gap-1">
                <button onClick={handleEdit} title="Edit" className="p-1.5 sm:p-2 bg-gray-100 rounded-lg text-base sm:text-lg hover:bg-gray-200 hover:scale-110 transition-all">✏️</button>
                <button onClick={handleDelete} title="Delete" className="p-1.5 sm:p-2 bg-red-50 rounded-lg text-base sm:text-lg hover:bg-red-100 hover:scale-110 transition-all">🗑️</button>
                <button onClick={closeViewModal} className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg sm:text-xl hover:bg-gray-200 hover:text-slate-800 transition-all ml-1 sm:ml-2">×</button>
              </div>
            </div>
            <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden mb-4 sm:mb-6 shadow-lg bg-gray-100">
              {selectedRoom.image ? (
                <Image src={selectedRoom.image} alt={selectedRoom.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl sm:text-6xl">🏢</div>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col gap-1 p-3 sm:p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-[10px] xs:text-xs uppercase tracking-wide font-semibold">Office Name</span>
                <span className="text-slate-800 text-base sm:text-lg font-semibold wrap-break-word">{selectedRoom.name}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 sm:p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-[10px] xs:text-xs uppercase tracking-wide font-semibold">Rent Fee</span>
                <span className="text-slate-800 text-base sm:text-lg font-semibold wrap-break-word">{getCurrencySymbol(selectedRoom.currency || 'PHP')}{selectedRoom.rentFee?.toLocaleString() || '0'} {selectedRoom.rentFeePeriod || 'per hour'}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 sm:p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-[10px] xs:text-xs uppercase tracking-wide font-semibold">Inclusions</span>
                <span className="text-slate-800 text-sm sm:text-lg font-semibold wrap-break-word whitespace-pre-line">{selectedRoom.inclusions || 'None'}</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {/* Edit Tenant Modal */}
      {showEditTenantModal && editingTenant && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-[fadeIn_0.2s_ease] p-4" onClick={closeEditTenantModal}>
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-100">
              <h2 className="text-slate-800 text-lg sm:text-xl font-bold">Edit Tenant Booking</h2>
              <button onClick={closeEditTenantModal} className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg sm:text-xl hover:bg-gray-200 hover:text-slate-800 transition-all">×</button>
            </div>
            
            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Tenant Name *</label>
                  <input
                    type="text"
                    value={tenantFormData.clientName}
                    onChange={(e) => setTenantFormData({ ...tenantFormData, clientName: e.target.value })}
                    placeholder="Enter tenant name"
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Email *</label>
                  <input
                    type="email"
                    value={tenantFormData.email}
                    onChange={(e) => setTenantFormData({ ...tenantFormData, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Contact Number *</label>
                <input
                  type="tel"
                  value={tenantFormData.contactNumber}
                  onChange={(e) => setTenantFormData({ ...tenantFormData, contactNumber: e.target.value })}
                  placeholder="Enter contact number"
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Office *</label>
                <select
                  value={tenantFormData.room}
                  onChange={(e) => setTenantFormData({ ...tenantFormData, room: e.target.value })}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                >
                  <option value="">Select office</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.name}>{room.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Start Date *</label>
                  <input
                    type="date"
                    value={tenantFormData.startDate}
                    onChange={(e) => setTenantFormData({ ...tenantFormData, startDate: e.target.value })}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">End Date</label>
                  <input
                    type="date"
                    value={tenantFormData.endDate}
                    onChange={(e) => setTenantFormData({ ...tenantFormData, endDate: e.target.value })}
                    min={tenantFormData.startDate}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Start Time</label>
                  <input
                    type="time"
                    value={tenantFormData.startTime}
                    onChange={(e) => setTenantFormData({ ...tenantFormData, startTime: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">End Time</label>
                  <input
                    type="time"
                    value={tenantFormData.endTime}
                    onChange={(e) => setTenantFormData({ ...tenantFormData, endTime: e.target.value })}
                    min={tenantFormData.startTime}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Status</label>
                <select
                  value={tenantFormData.status}
                  onChange={(e) => setTenantFormData({ ...tenantFormData, status: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                >
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-800 mb-2 font-semibold text-xs sm:text-sm">Notes</label>
                <textarea
                  value={tenantFormData.notes}
                  onChange={(e) => setTenantFormData({ ...tenantFormData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows="3"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeEditTenantModal}
                  className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTenant}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 sm:py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

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
            <button onClick={() => setToast({ show: false, message: '', type: 'success' })} className="ml-2 text-white/80 hover:text-white text-xl font-bold transition-colors flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20">×</button>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && mounted && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10001] animate-[fadeIn_0.2s_ease] p-4" 
          onClick={() => { 
            setShowConfirmDialog(false); 
            setConfirmAction(null);
            setConfirmDialogData({ type: '', title: '', message: '' });
          }}
        >
          <div 
            className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-7 w-full max-w-md shadow-2xl animate-[slideUp_0.3s_ease]" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-slate-800 text-lg sm:text-xl font-bold mb-2">
                {confirmDialogData.title || 'Confirm Deletion'}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {confirmDialogData.message || 'Are you sure you want to proceed? This action cannot be undone.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { 
                  setShowConfirmDialog(false); 
                  setConfirmAction(null);
                  setConfirmDialogData({ type: '', title: '', message: '' });
                }} 
                className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => { 
                  if (confirmAction) {
                    confirmAction();
                  }
                }} 
                disabled={loading}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


