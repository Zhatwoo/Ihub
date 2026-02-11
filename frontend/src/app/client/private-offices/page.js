'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { api, getUserFromCookie } from '@/lib/api';
import { useTranslation } from '@/lib/TranslationContext';

export default function PrivateOffices() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  // Ref to track rooms polling interval
  const roomsIntervalRef = useRef(null);
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
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [bookingStep, setBookingStep] = useState(1); // 1: Details, 2: Date/Time, 3: Review
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  // Get current user from cookies and fetch user info from backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user from cookie (tokens are in HttpOnly cookies)
        const user = getUserFromCookie();
        if (user && user.uid) {
          setCurrentUser({ uid: user.uid, email: user.email });
          
          // Fetch user details from backend API
          try {
            const response = await api.get(`/api/accounts/client/users/${user.uid}`);
            if (response.success && response.data) {
              setUserInfo(response.data);
              // Pre-fill form with user info
              setFormData(prev => ({
                ...prev,
                fullName: `${response.data.firstName || ''} ${response.data.lastName || ''}`.trim() || prev.fullName,
                email: response.data.email || user.email || prev.email,
                contactNumber: response.data.contact || prev.contactNumber
              }));
            }
          } catch (error) {
            if (error.response?.status !== 404) {
              console.error('Error fetching user info:', error);
            }
            // Use basic info from localStorage if API call fails
            setFormData(prev => ({
              ...prev,
              email: user.email || prev.email
            }));
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Read search query parameter from URL
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchParams]);

  // Fetch private offices from backend API (which fetches from Firestore database)
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setRoomsLoading(true);
        // Fetch from backend API endpoint: GET /api/rooms
        // Backend controller fetches from Firestore 'rooms' collection
        // All rooms created by admin are visible to all clients
        const response = await api.get('/api/rooms');
        if (response.success && response.data) {
          // Filter out occupied rooms - only show Vacant rooms to clients
          const availableRooms = response.data.filter(room => {
            // Check if room status is explicitly marked as "Occupied" by admin
            return room.status !== 'Occupied';
          });
          setRooms(availableRooms);
        } else {
          console.error('Failed to fetch rooms:', response.message);
          setRooms([]);
          showAlert('error', response.message || t('client.privateOffices.failedToLoadRooms'));
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setRooms([]);
        showAlert('error', error.message || t('client.privateOffices.failedToLoadRoomsLater'));
      } finally {
        setRoomsLoading(false);
      }
    };

    // Initial fetch only - AUTO REFRESH DISABLED
    fetchRooms();
    
    // DISABLED: Auto refresh/polling - was causing excessive Firestore reads
    // Data will only load once on mount, no automatic refresh
    // const handleVisibilityChange = () => { ... };
    // document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (roomsIntervalRef.current) {
        clearInterval(roomsIntervalRef.current);
        roomsIntervalRef.current = null;
      }
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
    // Auto-update end date minimum if start date changes
    if (name === 'startDate' && formData.endDate && value > formData.endDate) {
      setFormData(prev => ({ ...prev, endDate: '' }));
    }
  };

  // Validate form step by step
  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!formData.fullName.trim()) errors.fullName = t('client.privateOffices.validationFullNameRequired');
      if (!formData.email.trim()) {
        errors.email = t('client.privateOffices.validationEmailRequired');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = t('client.privateOffices.validationEmailInvalid');
      }
      if (!formData.contactNumber.trim()) {
        errors.contactNumber = t('client.privateOffices.validationContactRequired');
      } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.contactNumber.trim())) {
        errors.contactNumber = t('client.privateOffices.validationContactInvalid');
      }
    } else if (step === 2) {
      if (!formData.startDate) {
        errors.startDate = t('client.privateOffices.validationStartDateRequired');
      } else {
        const startDate = new Date(formData.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
          errors.startDate = t('client.privateOffices.validationStartDatePast');
        }
      }
      if (formData.endDate) {
        if (formData.endDate < formData.startDate) {
          errors.endDate = t('client.privateOffices.validationEndDateAfter');
        }
      }
      if (formData.startTime && formData.endTime) {
        if (formData.startTime >= formData.endTime) {
          errors.endTime = t('client.privateOffices.validationEndTimeAfter');
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(bookingStep)) {
      setBookingStep(prev => Math.min(prev + 1, 3));
      // Scroll to top of modal
      const modal = document.querySelector('[data-booking-modal]');
      if (modal) modal.scrollTop = 0;
    }
  };

  const prevStep = () => {
    setBookingStep(prev => Math.max(prev - 1, 1));
    const modal = document.querySelector('[data-booking-modal]');
    if (modal) modal.scrollTop = 0;
  };

  const openReservationModal = (room) => {
    // Dynamically set the selected room for booking
    if (!room) {
      console.error('No room provided for booking');
      showAlert('error', t('client.privateOffices.unableToOpenBooking'));
      return;
    }
    
    // Removed: Log containing room booking data
    setSelectedRoom(room);
    
    // Pre-fill with user info if available
    if (userInfo) {
      setFormData(prev => ({
        ...prev,
        fullName: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || prev.fullName,
        email: userInfo.email || currentUser?.email || prev.email,
        contactNumber: userInfo.contact || prev.contactNumber
      }));
    } else if (currentUser?.email) {
      // Use basic email if user is logged in but no userInfo yet
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || prev.email
      }));
    }
    
    // Ensure the form is ready
    setTimeout(() => {
    setShowReservationModal(true);
    }, 100);
  };

  const closeReservationModal = () => {
    setShowReservationModal(false);
    setSelectedRoom(null);
    setBookingStep(1);
    setFormErrors({});
    // Reset form but keep user info if available
    setFormData({
      fullName: userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() : '',
      email: userInfo?.email || currentUser?.email || '',
      contactNumber: userInfo?.contact || '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      notes: ''
    });
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
  };

  // Calculate booking duration
  const calculateDuration = () => {
    if (!formData.startDate) return null;
    if (!formData.endDate) return t('client.privateOffices.singleDay');
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays === 1) return t('client.privateOffices.oneDay');
    return t('client.privateOffices.days').replace('{{count}}', String(diffDays));
  };

  // Calculate estimated total cost
  const calculateEstimatedCost = () => {
    if (!selectedRoom || !formData.startDate) return null;
    
    const duration = calculateDuration();
    if (!duration || duration === 'Single day') {
      return {
        amount: selectedRoom.rentFee || 0,
        period: selectedRoom.rentFeePeriod || 'per hour'
      };
    }
    
    // For multiple days, estimate based on rent fee
    const days = parseInt(duration);
    // Assuming daily rate if period is "per hour" - this is a rough estimate
    const dailyRate = selectedRoom.rentFee || 0;
    return {
      amount: dailyRate * days,
      period: t('client.privateOffices.estimatedFor').replace('{{duration}}', duration)
    };
  };

  // Submit reservation/booking to backend API (which saves to Firestore database)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation
    if (!validateStep(2)) {
      setBookingStep(2);
      return;
    }
    
    // Validate that we have a selected room
    if (!selectedRoom || !selectedRoom.id) {
      showAlert('error', t('client.privateOffices.selectOfficeToBook'));
      return;
    }
    
    setLoading(true);
    try {
      // Prepare booking data - dynamically using current selectedRoom
      const reservationData = {
        clientName: formData.fullName.trim(),
        email: formData.email.trim(),
        contactNumber: formData.contactNumber.trim(),
        room: selectedRoom.name, // Dynamic: uses current office name
        roomId: selectedRoom.id, // Dynamic: uses current office ID
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        notes: formData.notes?.trim() || '',
        status: 'pending',
        requestType: 'privateroom',
        userId: currentUser?.uid || null, // Include userId if user is logged in
        createdAt: new Date().toISOString()
      };
      
      // Removed: Log containing booking data
      
      // Send to backend API endpoint: POST /api/schedules
      // Backend controller saves to Firestore 'schedules' collection
      const response = await api.post('/api/schedules', reservationData);
      
      if (response.success) {
        // Show success animation before closing
        setBookingStep(4); // Success step
        const successMsg = t('client.privateOffices.bookingSuccess').replace('{{name}}', selectedRoom.name);
        setTimeout(() => {
      closeReservationModal();
          showAlert('success', successMsg);
        }, 2000);
      } else {
        showAlert('error', response.message || t('client.privateOffices.failedToSubmit'));
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      
      let errorMessage = t('client.privateOffices.failedToSubmit');
      if (error.response?.status === 503) {
        errorMessage = t('client.privateOffices.serviceUnavailable');
      } else if (error.response?.status === 400) {
        errorMessage = t('client.privateOffices.invalidBookingData');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800">{t('client.privateOffices.title')}</h1>
            <p className="text-gray-600 mt-1 text-sm lg:text-base">{t('client.privateOffices.subtitle')}</p>
          </div>
          <input 
            type="text" 
            placeholder={t('client.privateOffices.searchPlaceholder')} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white w-full md:w-72 transition-all" 
          />
        </div>

        {roomsLoading ? (
          <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-gray-200">
            <div className="text-center py-12">
              <div className="text-5xl lg:text-6xl mb-4 animate-pulse">🏢</div>
              <p className="text-gray-500 text-base lg:text-lg">{t('client.privateOffices.loading')}</p>
            </div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-gray-200">
            <div className="text-center py-12">
              <div className="text-5xl lg:text-6xl mb-4">🏢</div>
              <p className="text-gray-500 text-base lg:text-lg">{searchTerm ? t('client.privateOffices.noOfficesFound') : t('client.privateOffices.noOfficesAvailable')}</p>
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
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-4 lg:p-5 flex flex-col flex-1">
                  <h3 className="text-slate-800 font-bold text-lg lg:text-xl mb-2">{room.name}</h3>
                  <div className="flex items-center gap-2 text-gray-500 text-xs lg:text-sm mb-2">
                    <span className="text-teal-600">💰</span>
                    <span>{t('client.privateOffices.rentalFee')}: {getCurrencySymbol(room.currency || 'PHP')}{room.rentFee?.toLocaleString() || '0'} {room.rentFeePeriod || t('client.privateOffices.perHour')}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailsRoom(room);
                      setShowDetailsModal(true);
                    }}
                    className="text-teal-600 hover:text-teal-700 text-xs lg:text-sm font-semibold mb-2 transition-colors text-left"
                  >
                    {t('client.privateOffices.fullDetails')}
                  </button>
                  <button 
                    onClick={() => openReservationModal(room)}
                    className="mt-auto w-full py-2.5 lg:py-3 bg-linear-to-r from-teal-600 to-teal-700 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-teal-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{t('client.privateOffices.bookNow')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showReservationModal && selectedRoom && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease] p-4">
          <div 
            data-booking-modal
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] shadow-2xl animate-[slideUp_0.3s_ease] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 px-6 pt-6 pb-4 border-b-2 border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-slate-800 text-2xl font-bold">{t('client.privateOffices.bookPrivateOffice')}</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    <span className="font-semibold text-teal-600">{selectedRoom.name}</span>
                  </p>
                </div>
                <button 
                  onClick={closeReservationModal} 
                  className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 hover:text-slate-800 transition-all shrink-0"
                >
                  ×
                </button>
              </div>
              
              {/* Progress Steps */}
              {bookingStep !== 4 && (
                <div className="flex items-center justify-between mb-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                            bookingStep >= step
                              ? 'bg-teal-600 text-white shadow-lg'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {bookingStep > step ? '✓' : step}
                        </div>
                        <span className={`text-xs mt-1 font-medium ${bookingStep >= step ? 'text-teal-600' : 'text-gray-400'}`}>
                          {step === 1 ? t('client.privateOffices.stepDetails') : step === 2 ? t('client.privateOffices.stepSchedule') : t('client.privateOffices.stepReview')}
                        </span>
                      </div>
                      {step < 3 && (
                        <div
                          className={`h-1 flex-1 mx-2 rounded transition-all ${
                            bookingStep > step ? 'bg-teal-600' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form onSubmit={handleSubmit} id="booking-form">
                {/* Step 1: Personal Details */}
                {bookingStep === 1 && (
                  <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-2">{t('client.privateOffices.personalInfo')}</h3>
                      <p className="text-sm text-gray-600">{t('client.privateOffices.personalInfoDesc')}</p>
                    </div>

                    <div>
                      <label className="block text-slate-800 mb-2 font-semibold text-sm flex items-center gap-1">
                        {t('client.privateOffices.fullName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        className={`w-full px-4 py-3 border-2 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:bg-white transition-all ${
                          formErrors.fullName ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-teal-600'
                        }`}
                      />
                      {formErrors.fullName && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <span>⚠</span> {formErrors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-800 mb-2 font-semibold text-sm flex items-center gap-1">
                        {t('client.privateOffices.emailAddress')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john.doe@example.com"
                        required
                        className={`w-full px-4 py-3 border-2 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:bg-white transition-all ${
                          formErrors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-teal-600'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <span>⚠</span> {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-800 mb-2 font-semibold text-sm flex items-center gap-1">
                        {t('client.privateOffices.contactNumber')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        placeholder="+63 912 345 6789"
                        required
                        className={`w-full px-4 py-3 border-2 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:bg-white transition-all ${
                          formErrors.contactNumber ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-teal-600'
                        }`}
                      />
                      {formErrors.contactNumber && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <span>⚠</span> {formErrors.contactNumber}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs mt-1">{t('client.privateOffices.contactConfirmNote')}</p>
                    </div>
                  </div>
                )}

                {/* Step 2: Date & Time */}
                {bookingStep === 2 && (
                  <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-2">{t('client.privateOffices.bookingSchedule')}</h3>
                      <p className="text-sm text-gray-600">{t('client.privateOffices.bookingScheduleDesc')}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-800 mb-2 font-semibold text-sm flex items-center gap-1">
                          {t('client.privateOffices.startDate')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          className={`w-full px-4 py-3 border-2 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:bg-white transition-all ${
                            formErrors.startDate ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-teal-600'
                          }`}
                        />
                        {formErrors.startDate && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <span>⚠</span> {formErrors.startDate}
                          </p>
                        )}
              </div>

                      <div>
                        <label className="block text-slate-800 mb-2 font-semibold text-sm">
                          {t('client.privateOffices.endDateOptional')}
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          min={formData.startDate || new Date().toISOString().split('T')[0]}
                          className={`w-full px-4 py-3 border-2 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:bg-white transition-all ${
                            formErrors.endDate ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-teal-600'
                          }`}
                        />
                        {formErrors.endDate && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <span>⚠</span> {formErrors.endDate}
                          </p>
                        )}
                        {formData.endDate && (
                          <p className="text-teal-600 text-xs mt-1">Duration: {calculateDuration()}</p>
                        )}
                      </div>
              </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-800 mb-2 font-semibold text-sm">
                          {t('client.privateOffices.startTimeOptional')}
                        </label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                        />
              </div>

                      <div>
                        <label className="block text-slate-800 mb-2 font-semibold text-sm">
                          {t('client.privateOffices.endTimeOptional')}
                        </label>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          min={formData.startTime || undefined}
                          className={`w-full px-4 py-3 border-2 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:bg-white transition-all ${
                            formErrors.endTime ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-teal-600'
                          }`}
                        />
                        {formErrors.endTime && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <span>⚠</span> {formErrors.endTime}
                          </p>
                        )}
                      </div>
              </div>

                    <div>
                      <label className="block text-slate-800 mb-2 font-semibold text-sm">
                        {t('client.privateOffices.additionalNotes')}
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder={t('client.privateOffices.notesPlaceholder')}
                        rows="3"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-slate-900 bg-gray-50 focus:outline-none focus:border-teal-600 focus:bg-white transition-all resize-none"
                      />
                      <p className="text-gray-500 text-xs mt-1">{t('client.privateOffices.specialReqsNote')}</p>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Confirm */}
                {bookingStep === 3 && (
                  <div className="space-y-5 animate-[fadeIn_0.3s_ease]">
              <div className="mb-6">
                      <h3 className="text-lg font-bold text-slate-800 mb-2">{t('client.privateOffices.reviewBooking')}</h3>
                      <p className="text-sm text-gray-600">{t('client.privateOffices.reviewDesc')}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {t('client.privateOffices.officeDetails')}
                        </h4>
                        <div className="bg-white rounded-lg p-4 space-y-2">
                          <p className="text-slate-800"><span className="font-semibold">{t('client.privateOffices.officeName')}:</span> {selectedRoom.name}</p>
                          <p className="text-teal-600 font-bold">
                            <span className="font-semibold text-slate-800">{t('client.privateOffices.rentalFee')}:</span> {getCurrencySymbol(selectedRoom.currency || 'PHP')}{selectedRoom.rentFee?.toLocaleString() || '0'} {selectedRoom.rentFeePeriod || t('client.privateOffices.perHour')}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {t('client.privateOffices.contactInfo')}
                        </h4>
                        <div className="bg-white rounded-lg p-4 space-y-2">
                          <p><span className="font-semibold">{t('client.privateOffices.fullName')}:</span> {formData.fullName}</p>
                          <p><span className="font-semibold">{t('client.privateOffices.emailAddress')}:</span> {formData.email}</p>
                          <p><span className="font-semibold">{t('client.privateOffices.contactNumber')}:</span> {formData.contactNumber}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {t('client.privateOffices.schedule')}
                        </h4>
                        <div className="bg-white rounded-lg p-4 space-y-2">
                          <p><span className="font-semibold">Start:</span> {new Date(formData.startDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}{formData.startTime && ` at ${formData.startTime}`}</p>
                          {formData.endDate && (
                            <p><span className="font-semibold">End:</span> {new Date(formData.endDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}{formData.endTime && ` at ${formData.endTime}`}</p>
                          )}
                          {formData.endDate && (
                            <p className="text-teal-600 font-semibold">{t('client.privateOffices.durationLabel')}: {calculateDuration()}</p>
                          )}
                        </div>
                      </div>

                      {formData.notes && (
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            {t('client.privateOffices.notes')}
                          </h4>
                          <div className="bg-white rounded-lg p-4">
                            <p className="whitespace-pre-line">{formData.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-800 font-semibold">{t('client.privateOffices.estimatedTotal')}</span>
                        <span className="text-teal-700 font-bold text-xl">
                          {(() => {
                            const cost = calculateEstimatedCost();
                            if (!cost) return 'N/A';
                            return `${getCurrencySymbol(selectedRoom.currency || 'PHP')}${cost.amount?.toLocaleString() || '0'} ${cost.period || ''}`;
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{t('client.privateOffices.finalPricingNote')}</p>
                    </div>
                  </div>
                )}

                {/* Step 4: Success */}
                {bookingStep === 4 && (
                  <div className="flex flex-col items-center justify-center py-12 animate-[fadeIn_0.3s_ease]">
                    <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
                      <svg className="w-12 h-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('client.privateOffices.bookingSubmitted')}</h3>
                    <p className="text-gray-600 text-center mb-6">
                      {t('client.privateOffices.bookingSubmittedDesc')}
                    </p>
                  </div>
                )}
              </form>
              </div>

            {/* Footer - Action Buttons */}
            {bookingStep !== 4 && (
              <div className="shrink-0 px-6 py-4 border-t-2 border-gray-100 bg-gray-50">
              <div className="flex gap-3">
                  {bookingStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-3 bg-white text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition-all border-2 border-gray-200"
                    >
                      {t('client.privateOffices.previous')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeReservationModal}
                    className={`px-6 py-3 bg-white text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition-all border-2 border-gray-200 ${bookingStep === 1 ? 'flex-1' : ''}`}
                  >
                    {t('client.privateOffices.cancel')}
                  </button>
                  {bookingStep < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 py-3 bg-linear-to-r from-teal-600 to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:shadow-xl transition-all"
                    >
                      {t('client.privateOffices.nextStep')}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      form="booking-form"
                      disabled={loading}
                      className="flex-1 py-3 bg-linear-to-r from-teal-600 to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-600/30 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('client.privateOffices.submitting')}
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {t('client.privateOffices.confirmBooking')}
                        </>
                      )}
                </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showDetailsModal && detailsRoom && (
        <div className="fixed inset-0 bg-slate-800/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] shadow-2xl animate-[slideUp_0.3s_ease] flex flex-col">
            {/* Header - Fixed */}
            <div className="flex justify-between items-center p-6 pb-4 border-b-2 border-gray-100 flex-shrink-0">
              <div className="flex-1">
                <h2 className="text-slate-800 text-2xl font-bold">{detailsRoom.name}</h2>
                <p className="text-gray-500 text-sm mt-1">{t('client.privateOffices.privateOfficeDetails')}</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Book Now Button in Header - Always Visible */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Book Now clicked from header for:', detailsRoom.name, detailsRoom.id);
                    setShowDetailsModal(false);
                    setTimeout(() => {
                      openReservationModal(detailsRoom);
                    }, 150);
                  }}
                  className="px-5 py-2.5 bg-linear-to-r from-teal-600 to-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-600/50 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/60 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t('client.privateOffices.bookNow')}</span>
                </button>
              <button 
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsRoom(null);
                }} 
                  className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 hover:text-slate-800 transition-all flex-shrink-0"
              >
                ×
              </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-6 pt-4">
            <div className="relative w-full h-64 rounded-xl overflow-hidden mb-6 shadow-lg bg-gray-100">
              {detailsRoom.image ? (
                <Image src={detailsRoom.image} alt={detailsRoom.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">🏢</div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">{t('client.privateOffices.officeName')}</span>
                <span className="text-slate-800 text-xl font-semibold">{detailsRoom.name}</span>
              </div>

              <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">{t('client.privateOffices.rentalFeeLabel')}</span>
                <span className="text-slate-800 text-xl font-semibold">
                  {getCurrencySymbol(detailsRoom.currency || 'PHP')}{detailsRoom.rentFee?.toLocaleString() || '0'} {detailsRoom.rentFeePeriod || t('client.privateOffices.perHour')}
                </span>
              </div>

                {detailsRoom.description && (
                  <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                    <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">{t('client.privateOffices.description')}</span>
                    <span className="text-slate-800 text-lg whitespace-pre-line">{detailsRoom.description}</span>
                  </div>
                )}

              {detailsRoom.inclusions && (
                <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">{t('client.privateOffices.inclusions')}</span>
                  <span className="text-slate-800 text-lg whitespace-pre-line">{detailsRoom.inclusions}</span>
                </div>
              )}
              </div>
            </div>

            {/* Book Now Section - Fixed at Bottom - Always Visible */}
            <div className="p-6 pt-4 border-t-2 border-gray-200 bg-white shrink-0 sticky bottom-0">
              {/* Prominent Booking CTA Box */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-300 rounded-xl p-6 mb-4 shadow-lg">
                <div className="text-center mb-5">
                  <p className="text-gray-700 text-base font-medium mb-3">{t('client.privateOffices.readyToBook')}</p>
                  <div className="bg-white rounded-lg p-3 inline-block mb-3">
                    <p className="text-gray-600 text-xs mb-1">{t('client.privateOffices.rentalFeeShort')}</p>
                    <p className="text-teal-700 font-bold text-2xl">
                      {getCurrencySymbol(detailsRoom.currency || 'PHP')}{detailsRoom.rentFee?.toLocaleString() || '0'} {detailsRoom.rentFeePeriod || t('client.privateOffices.perHour')}
                    </p>
                  </div>
            </div>

                {/* Primary Book Now Button - Large and Prominent */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Removed: Log containing room data
                    // Close details modal and open booking modal with current office
                    setShowDetailsModal(false);
                    // Small delay to ensure modal closes before opening new one
                    setTimeout(() => {
                      openReservationModal(detailsRoom);
                    }, 150);
                  }}
                  className="w-full py-5 px-6 bg-linear-to-r from-teal-600 to-teal-700 text-white rounded-xl font-bold text-xl shadow-xl shadow-teal-600/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-600/60 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t('client.privateOffices.bookRoomNow').replace('{{name}}', detailsRoom.name)}</span>
                </button>
                <p className="text-center text-gray-600 text-xs mt-3">
                  {t('client.privateOffices.clickToFillForm')}
                </p>
              </div>

              {/* Secondary Close button */}
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  setDetailsRoom(null);
                }}
                className="w-full px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm"
              >
                {t('client.privateOffices.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {alert.show && (
        <div className="fixed top-6 right-6 z-50 animate-[slideUp_0.3s_ease]">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${alert.type === 'success' ? 'bg-linear-to-r from-teal-600 to-teal-700 text-white' : 'bg-linear-to-r from-red-500 to-red-600 text-white'}`}>
            <span className="text-2xl">{alert.type === 'success' ? '✓' : '✕'}</span>
            <span className="font-medium">{alert.message}</span>
            <button onClick={() => setAlert({ show: false, type: '', message: '' })} className="ml-2 text-white/80 hover:text-white text-xl">×</button>
          </div>
        </div>
      )}
    </div>
  );
}


