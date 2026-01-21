'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { League_Spartan } from 'next/font/google';
import { usePrivateOffices } from './privateOffices';
import { api } from '@/lib/api';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-league-spartan',
});

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

export default function PrivateOfficesSection() {
  const carouselRef = useRef(null);
  const { rooms, loading } = usePrivateOffices();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Booking modal states
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [bookingLoading, setBookingLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    companyName: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  // Get current user from localStorage and fetch user info from backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (typeof window === 'undefined') return;
        
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
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
                contactNumber: response.data.contact || prev.contactNumber,
                companyName: response.data.company || prev.companyName
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
      if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
      if (!formData.contactNumber.trim()) {
        errors.contactNumber = 'Contact number is required';
      } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.contactNumber.trim())) {
        errors.contactNumber = 'Please enter a valid contact number';
      }
    } else if (step === 2) {
      if (!formData.startDate) {
        errors.startDate = 'Start date is required';
      } else {
        const startDate = new Date(formData.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
          errors.startDate = 'Start date cannot be in the past';
        }
      }
      if (formData.endDate) {
        if (formData.endDate < formData.startDate) {
          errors.endDate = 'End date must be after start date';
        }
      }
      if (formData.startTime && formData.endTime) {
        if (formData.startTime >= formData.endTime) {
          errors.endTime = 'End time must be after start time';
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(bookingStep)) {
      const nextStepNum = Math.min(bookingStep + 1, 3);
      setBookingStep(nextStepNum);
      // Scroll to top of modal
      const modal = document.querySelector('[data-booking-modal]');
      if (modal) modal.scrollTop = 0;
      
      // If moving to Step 3, ensure modal stays open
      if (nextStepNum === 3) {
        console.log('Reached Step 3 - Review section. Modal will stay open until user submits.');
      }
    }
  };

  const prevStep = () => {
    setBookingStep(prev => Math.max(prev - 1, 1));
    const modal = document.querySelector('[data-booking-modal]');
    if (modal) modal.scrollTop = 0;
  };

  // Calculate booking duration
  const calculateDuration = () => {
    if (!formData.startDate) return null;
    if (!formData.endDate) return 'Single day';
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
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
    const dailyRate = selectedRoom.rentFee || 0;
    return {
      amount: dailyRate * days,
      period: 'estimated for ' + duration
    };
  };

  const openReservationModal = (room) => {
    if (!room) {
      console.error('No room provided for booking');
      return;
    }
    
    console.log('Opening booking modal for room:', room.name || room.title, room.id);
    setSelectedRoom(room);
    
    // Pre-fill with user info if available
    if (userInfo) {
      setFormData(prev => ({
        ...prev,
        fullName: `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || prev.fullName,
        email: userInfo.email || currentUser?.email || prev.email,
        contactNumber: userInfo.contact || prev.contactNumber,
        companyName: userInfo.company || prev.companyName
      }));
    } else if (currentUser?.email) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || prev.email
      }));
    }
    
    // Close details modal and open booking modal
    setIsModalOpen(false);
    setTimeout(() => {
      setShowReservationModal(true);
      setBookingStep(1);
    }, 150);
  };

  const closeReservationModal = () => {
    // Don't close if currently submitting on step 3
    if (bookingStep === 3 && bookingLoading) {
      return; // Prevent closing while submitting
    }
    
    setShowReservationModal(false);
    setBookingStep(1);
    setFormErrors({});
    // Reset form but keep user info if available
    setFormData({
      fullName: userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() : '',
      email: userInfo?.email || currentUser?.email || '',
      contactNumber: userInfo?.contact || '',
      companyName: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      notes: ''
    });
  };

  // Submit reservation/booking to backend API
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Prevent multiple submissions
    if (bookingLoading) {
      return;
    }
    
    // Final validation
    if (!validateStep(2)) {
      setBookingStep(2);
      return;
    }
    
    // Validate that we have a selected room
    if (!selectedRoom || !selectedRoom.id) {
      console.error('No selected room for booking');
      return;
    }
    
    // Ensure we're on step 3
    if (bookingStep !== 3) {
      setBookingStep(3);
      return;
    }
    
    setBookingLoading(true);
    try {
      const reservationData = {
        clientName: formData.fullName.trim(),
        email: formData.email.trim(),
        contactNumber: formData.contactNumber.trim(),
        companyName: formData.companyName.trim(),
        room: selectedRoom.name || selectedRoom.title,
        roomId: selectedRoom.id,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        notes: formData.notes?.trim() || '',
        status: 'pending',
        requestType: 'privateroom',
        userId: currentUser?.uid || null,
        createdAt: new Date().toISOString()
      };
      
      console.log('Submitting booking:', {
        room: reservationData.room,
        roomId: reservationData.roomId,
        clientName: reservationData.clientName,
        companyName: reservationData.companyName,
        fullData: reservationData
      });
      
      const response = await api.post('/api/schedules', reservationData);
      
      if (response && response.success) {
        // Show success animation - DO NOT close immediately
        setBookingLoading(false);
        setBookingStep(4);
        // Wait longer before closing so user can see the success message
        // Only close if user clicks the Close button in success screen
        // Remove auto-close timeout
      } else {
        // Response not successful - stay on step 3
        console.error('Booking submission failed:', response);
        setBookingLoading(false);
        alert(response?.message || 'Failed to submit booking. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      setBookingLoading(false);
      // Stay on step 3 when there's an error - don't close modal
      const errorMessage = error.message || error.response?.data?.message || 'Failed to submit booking. Please try again.';
      alert(errorMessage);
      // Keep modal open on error
    }
  };

  const handleBookNow = () => {
    if (selectedRoom) {
      openReservationModal(selectedRoom);
    }
  };

  const scrollCarousel = (direction) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    const cardWidth = 320; // Card width including gap
    const scrollAmount = cardWidth * 2; // Scroll 2 cards at a time
    
    if (direction === 'left') {
      carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCardClick = (room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  // Hide entire section if no rooms are available (after loading completes)
  if (!loading && rooms.length === 0) {
    return null;
  }

  return (
    <section className="pt-20 pb-8 bg-white">
      <div className="max-w-[90%] mx-auto px-4">
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`${leagueSpartan.className} text-3xl font-bold text-slate-800`}>Private Offices</h2>
            <div className="flex gap-2">
              <button
                onClick={() => scrollCarousel('left')}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Scroll left"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Scroll right"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto hide-scrollbar pb-4 scroll-smooth"
          >
            {loading ? (
              <div className="flex items-center justify-center w-full py-12">
                <p className="text-gray-500">Loading private offices...</p>
              </div>
            ) : (
              rooms.map((feature, index) => (
                <div
                  key={feature.id}
                  onClick={() => handleCardClick(feature)}
                  className="shrink-0 w-[300px] rounded-2xl overflow-hidden cursor-pointer group relative transition-all duration-300 shadow-md hover:shadow-2xl hover:ring-2 hover:ring-teal-500"
                >
                <div className="relative h-[200px]">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                    onError={({ currentTarget }) => {
                      // Fallback placeholder when image fails to load
                      currentTarget.onerror = null;
                      currentTarget.src = '/images/inspirelogo.png';
                    }}
                  />
                </div>
                  <div className="p-4 bg-white">
                    {index === 0 && (
                      <div className="inline-block bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mb-1">
                        FEATURED
                      </div>
                    )}
                    <h3 className="text-lg font-semibold mb-2 text-slate-800">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{feature.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Private Office Details Modal - Modern Minimalist Design */}
      {isModalOpen && selectedRoom && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-3xl shadow-xl max-w-3xl w-full max-h-[92vh] overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Minimalist Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10 shrink-0">
              <div className="flex-1">
                <h2 className={`${leagueSpartan.className} text-2xl font-semibold text-slate-900 tracking-tight`}>
                  {selectedRoom.title || selectedRoom.name}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0 text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Image - Cleaner Design */}
              <div className="relative w-full h-72 overflow-hidden">
                <Image
                  src={selectedRoom.image}
                  alt={selectedRoom.title || selectedRoom.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Information - Minimalist Cards */}
              <div className="p-8 space-y-6">
                {/* Price - Prominent */}
                <div className="pb-6 border-b border-gray-100">
                  <div className="flex items-baseline gap-2">
                    <span className="text-gray-500 text-sm font-medium">Rental Fee</span>
                    <span className="text-slate-900 text-3xl font-semibold">
                      {getCurrencySymbol(selectedRoom.currency || 'PHP')}
                      {selectedRoom.rentFee?.toLocaleString() || '0'}
                    </span>
                    <span className="text-gray-500 text-sm">{selectedRoom.rentFeePeriod || 'per hour'}</span>
                  </div>
                </div>

                {/* Description */}
                {selectedRoom.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Description</h3>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">{selectedRoom.description}</p>
                  </div>
                )}

                {/* Inclusions */}
                {selectedRoom.inclusions && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">Inclusions</h3>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">{selectedRoom.inclusions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Minimalist Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookNow();
                }}
                className="w-full py-3.5 px-6 text-white rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#0F766E' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0d6b63'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#0F766E'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Book Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Step Booking Modal - Modern Minimalist Design */}
      {showReservationModal && selectedRoom && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Prevent closing when clicking backdrop - only allow manual close
            e.stopPropagation();
          }}
        >
          <div 
            data-booking-modal
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[95vh] shadow-xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Minimalist Header */}
            <div className="shrink-0 px-8 pt-6 pb-5 border-b border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <div className="flex-1">
                  <h2 className="text-slate-900 text-xl font-semibold tracking-tight">Book Private Office</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {selectedRoom.name || selectedRoom.title}
                  </p>
                </div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeReservationModal();
                  }}
                  disabled={bookingStep === 3 && bookingLoading}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Minimalist Progress Steps */}
              {bookingStep !== 4 && (
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex items-center flex-1">
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                              bookingStep >= step
                                ? 'bg-slate-900 text-white'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            {bookingStep > step ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              step
                            )}
                          </div>
                          <span className={`text-xs font-medium hidden sm:block ${bookingStep >= step ? 'text-slate-900' : 'text-gray-400'}`}>
                            {step === 1 ? 'Details' : step === 2 ? 'Schedule' : 'Review'}
                          </span>
                        </div>
                        {step < 3 && (
                          <div
                            className={`h-px flex-1 mx-3 transition-all ${
                              bookingStep > step ? 'bg-slate-900' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <form 
                onSubmit={(e) => {
                  // Prevent ALL automatic form submissions
                  // Form will only submit via explicit button click in Step 3
                  e.preventDefault();
                  e.stopPropagation();
                }} 
                id="booking-form"
                onKeyDown={(e) => {
                  // Prevent Enter key from submitting form
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // Only allow Enter to work on input fields, not to submit form
                  }
                }}
              >
                {/* Step 1: Personal Details */}
                {bookingStep === 1 && (
                  <div className="space-y-6">
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1.5">Personal Information</h3>
                      <p className="text-sm text-gray-500">Please provide your contact details</p>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-2 text-sm font-medium">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                        className={`w-full px-4 py-3 border rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all ${
                          formErrors.fullName ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                      />
                      {formErrors.fullName && (
                        <p className="text-red-500 text-xs mt-1.5">{formErrors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-2 text-sm font-medium">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john.doe@example.com"
                        required
                        className={`w-full px-4 py-3 border rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all ${
                          formErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-xs mt-1.5">{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-2 text-sm font-medium">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        placeholder="+63 912 345 6789"
                        required
                        className={`w-full px-4 py-3 border rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all ${
                          formErrors.contactNumber ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                        }`}
                      />
                      {formErrors.contactNumber && (
                        <p className="text-red-500 text-xs mt-1.5">{formErrors.contactNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-2 text-sm font-medium">
                        Company Name <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Your company name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Date & Time */}
                {bookingStep === 2 && (
                  <div className="space-y-6">
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1.5">Booking Schedule</h3>
                      <p className="text-sm text-gray-500">Select your preferred dates and times</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 mb-2 text-sm font-medium">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          className={`w-full px-4 py-3 border rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all ${
                            formErrors.startDate ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        />
                        {formErrors.startDate && (
                          <p className="text-red-500 text-xs mt-1.5">{formErrors.startDate}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-2 text-sm font-medium">
                          End Date <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          min={formData.startDate || new Date().toISOString().split('T')[0]}
                          className={`w-full px-4 py-3 border rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all ${
                            formErrors.endDate ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        />
                        {formErrors.endDate && (
                          <p className="text-red-500 text-xs mt-1.5">{formErrors.endDate}</p>
                        )}
                        {formData.endDate && (
                          <p className="text-slate-600 text-xs mt-1.5">Duration: {calculateDuration()}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 mb-2 text-sm font-medium">
                          Start Time <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 mb-2 text-sm font-medium">
                          End Time <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          min={formData.startTime || undefined}
                          className={`w-full px-4 py-3 border rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all ${
                            formErrors.endTime ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'
                          }`}
                        />
                        {formErrors.endTime && (
                          <p className="text-red-500 text-xs mt-1.5">{formErrors.endTime}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-2 text-sm font-medium">
                        Additional Notes <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Any special requests or additional information..."
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Confirm */}
                {bookingStep === 3 && (
                  <div className="space-y-6">
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1.5">Review Your Booking</h3>
                      <p className="text-sm text-gray-500">Please review all details before submitting</p>
                    </div>

                    <div className="space-y-5">
                      <div className="pb-5 border-b border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Office Details</h4>
                        <div className="space-y-1">
                          <p className="text-slate-900 font-medium">{selectedRoom.name || selectedRoom.title}</p>
                          <p className="text-slate-700 text-sm">
                            {getCurrencySymbol(selectedRoom.currency || 'PHP')}
                            {selectedRoom.rentFee?.toLocaleString() || '0'} {selectedRoom.rentFeePeriod || 'per hour'}
                          </p>
                        </div>
                      </div>

                      <div className="pb-5 border-b border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Contact Information</h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-700"><span className="text-gray-500">Name:</span> {formData.fullName}</p>
                          <p className="text-slate-700"><span className="text-gray-500">Email:</span> {formData.email}</p>
                          <p className="text-slate-700"><span className="text-gray-500">Contact:</span> {formData.contactNumber}</p>
                        </div>
                      </div>

                      <div className="pb-5 border-b border-gray-100">
                        <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Schedule</h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-700">
                            <span className="text-gray-500">Start:</span> {new Date(formData.startDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}{formData.startTime && ` at ${formData.startTime}`}
                          </p>
                          {formData.endDate && (
                            <p className="text-slate-700">
                              <span className="text-gray-500">End:</span> {new Date(formData.endDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}{formData.endTime && ` at ${formData.endTime}`}
                            </p>
                          )}
                          {formData.endDate && (
                            <p className="text-slate-600 font-medium mt-2">Duration: {calculateDuration()}</p>
                          )}
                        </div>
                      </div>

                      {formData.notes && (
                        <div className="pb-5 border-b border-gray-100">
                          <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Notes</h4>
                          <p className="text-slate-700 text-sm whitespace-pre-line">{formData.notes}</p>
                        </div>
                      )}

                      <div className="pt-4">
                        <div className="flex items-center justify-between py-4 border-t border-b border-gray-100">
                          <span className="text-slate-700 font-medium">Estimated Total</span>
                          <span className="text-slate-900 font-semibold text-lg">
                            {(() => {
                              const cost = calculateEstimatedCost();
                              if (!cost) return 'N/A';
                              return `${getCurrencySymbol(selectedRoom.currency || 'PHP')}${cost.amount?.toLocaleString() || '0'} ${cost.period || ''}`;
                            })()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">Final pricing will be confirmed after review</p>
                      </div>
                      
                      {/* Submit Button in Step 3 - Only way to submit */}
                      <div className="pt-6 pb-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Explicitly call handleSubmit only when button is clicked
                            if (bookingStep === 3 && !bookingLoading) {
                              handleSubmit(e);
                            }
                          }}
                          disabled={bookingLoading || bookingStep !== 3}
                          className="w-full py-3.5 px-6 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          style={{ backgroundColor: '#0F766E' }}
                          onMouseEnter={(e) => !bookingLoading && (e.target.style.backgroundColor = '#0d6b63')}
                          onMouseLeave={(e) => !bookingLoading && (e.target.style.backgroundColor = '#0F766E')}
                        >
                          {bookingLoading ? (
                            <>
                              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Confirm Booking
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Success */}
                {bookingStep === 4 && (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 animate-bounce">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Booking Submitted Successfully!</h3>
                    <p className="text-gray-500 text-center text-sm max-w-sm mb-6">
                      Your booking request has been received. We'll contact you shortly to confirm your reservation.
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        closeReservationModal();
                      }}
                      className="px-6 py-2.5 text-white rounded-lg font-medium transition-colors text-sm"
                      style={{ backgroundColor: '#0F766E' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0d6b63'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#0F766E'}
                    >
                      Close
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Minimalist Footer - Action Buttons */}
            {bookingStep !== 4 && (
              <div className="shrink-0 px-8 py-5 border-t border-gray-100 bg-white">
                <div className="flex gap-3">
                  {bookingStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-5 py-2.5 text-slate-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                    >
                      ← Previous
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      closeReservationModal();
                    }}
                    disabled={bookingStep === 3 && bookingLoading}
                    className={`px-5 py-2.5 text-slate-600 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ${bookingStep === 1 ? 'flex-1' : ''}`}
                  >
                    Cancel
                  </button>
                  {bookingStep < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 py-2.5 text-white rounded-lg font-medium transition-colors text-sm"
                      style={{ backgroundColor: '#0F766E' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0d6b63'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#0F766E'}
                    >
                      Next Step →
                    </button>
                  ) : (
                    // Step 3 - Don't show submit button in footer since we have one in Step 3 content
                    // This prevents auto-submission. User must click the button in Step 3 content.
                    <div className="flex-1 text-center text-sm text-gray-500 py-2.5">
                      Click "Confirm Booking" above to submit
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

