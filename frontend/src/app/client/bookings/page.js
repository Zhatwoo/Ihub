'use client';

import { useState, useEffect, useRef } from 'react';
import { api, getUserFromCookie } from '@/lib/api';
import { League_Spartan, Roboto } from 'next/font/google';
import { motion } from 'framer-motion';
import { showToast } from '@/components/Toast';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500'],
});

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingBookingId, setDeletingBookingId] = useState(null);
  
  // Refs to track intervals and prevent duplicate polling
  const bookingsIntervalRef = useRef(null);
  const roomsIntervalRef = useRef(null);

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
            }
          } catch (error) {
            // Handle 404 (user not found) gracefully - this is expected for new users
            if (error.response?.status === 404) {
              // User not found in accounts collection - use basic info from localStorage
              setUserInfo({ email: user.email });
            } else {
              console.error('Error fetching user info:', error);
              setUserInfo({ email: user.email });
            }
          }
        } else {
          setCurrentUser(null);
          setUserInfo(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setCurrentUser(null);
        setUserInfo(null);
        setLoading(false);
      }
    };

    fetchUserData();
    
    // REMOVED: Storage change listener - was causing excessive API calls
    // User data is now cached and only fetched once on mount
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Currency symbol helper
  const getCurrencySymbol = (currency) => {
    const symbols = {
      'PHP': '₱', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
      'AUD': 'A$', 'CAD': 'C$', 'CNY': '¥', 'INR': '₹', 'SGD': 'S$'
    };
    return symbols[currency] || '₱';
  };

  // Refetch bookings function - can be called after mutations
  const refetchBookings = async () => {
    if (!currentUser) return;

    const userId = currentUser.uid;
    const userEmail = currentUser.email?.toLowerCase() || '';
    
    const userFullName = userInfo 
      ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim().toLowerCase()
      : '';
    const userFirstName = userInfo?.firstName?.toLowerCase() || '';
    const userLastName = userInfo?.lastName?.toLowerCase() || '';
    
    try {
      // Fetch desk assignments
      const deskAssignmentsResponse = await api.get('/api/desk-assignments');
      const deskBookings = [];
      
      if (deskAssignmentsResponse.success && deskAssignmentsResponse.data) {
        deskAssignmentsResponse.data.forEach((assignmentData) => {
          const deskId = assignmentData.id;
          const assignmentEmail = assignmentData.email?.toLowerCase() || '';
          const assignmentName = assignmentData.name?.toLowerCase() || '';
          
          const emailMatch = userEmail && assignmentEmail && assignmentEmail === userEmail;
          const nameMatch = userFullName && assignmentName && assignmentName === userFullName;
          const firstNameMatch = userFirstName && assignmentName && assignmentName.includes(userFirstName);
          const lastNameMatch = userLastName && assignmentName && assignmentName.includes(userLastName);
          
          const isUserAssignment = emailMatch || nameMatch || (firstNameMatch && lastNameMatch);
          
          if (isUserAssignment) {
            const finalDeskId = assignmentData.desk || deskId;
            
            const booking = {
              ...assignmentData,
              id: finalDeskId,
              type: 'desk',
              deskId: finalDeskId,
              desk: finalDeskId,
              room: assignmentData.section || assignmentData.location || 'Dedicated Desk',
              section: assignmentData.section || finalDeskId.substring(0, 1),
              location: assignmentData.location || 'Alliance Global Tower',
              clientName: assignmentData.name || 'User',
              email: assignmentData.email || '',
              contactNumber: assignmentData.contactNumber || '',
              company: assignmentData.company || '',
              startDate: assignmentData.assignedAt || assignmentData.createdAt || assignmentData.updatedAt,
              createdAt: assignmentData.assignedAt || assignmentData.createdAt,
              status: 'approved',
            };
            deskBookings.push(booking);
          }
        });
      }

      // Fetch virtual office clients for this user
      const virtualOfficeResponse = await api.get(`/api/virtual-office/user/${userId}`).catch(() => ({ success: false, data: [] }));
      const virtualOfficeBookings = [];
      
      if (virtualOfficeResponse.success && virtualOfficeResponse.data) {
        virtualOfficeResponse.data.forEach((clientData) => {
          const clientId = clientData.id;
          
          const booking = {
            id: clientId,
            type: 'virtual-office',
            room: 'Virtual Office',
            clientName: clientData.fullName || 'User',
            email: clientData.email || '',
            contactNumber: clientData.phoneNumber || '',
            company: clientData.company || '',
            position: clientData.position || '',
            startDate: clientData.dateStart || clientData.createdAt,
            createdAt: clientData.createdAt,
            status: 'active',
            ...clientData,
          };
          virtualOfficeBookings.push(booking);
        });
      }

      // Fetch schedules/bookings
      const schedulesResponse = await api.get(`/api/schedules/user/${userId}`);
      const scheduleBookings = [];
      
      if (schedulesResponse.success && schedulesResponse.data) {
        schedulesResponse.data.forEach((scheduleData) => {
          const booking = {
            id: scheduleData.id,
            type: 'privateroom',
            room: scheduleData.room || 'Private Room',
            roomId: scheduleData.roomId || '',
            clientName: scheduleData.clientName || 'User',
            email: scheduleData.email || '',
            contactNumber: scheduleData.contactNumber || '',
            startDate: scheduleData.startDate,
            endDate: scheduleData.endDate,
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime,
            createdAt: scheduleData.createdAt,
            status: scheduleData.status || 'pending',
            notes: scheduleData.notes || '',
            ...scheduleData,
          };
          scheduleBookings.push(booking);
        });
      }

      // Combine all bookings
      const allBookings = [...deskBookings, ...virtualOfficeBookings, ...scheduleBookings];

      // Remove duplicates
      const uniqueBookings = allBookings.reduce((acc, booking) => {
        const existing = acc.find(b => b.id === booking.id && b.type === booking.type);
        if (!existing) {
          acc.push(booking);
        }
        return acc;
      }, []);

      // Sort by date (newest first)
      const sortedBookings = uniqueBookings.sort((a, b) => {
        const dateA = new Date(a.startDate || a.assignedAt || a.createdAt || a.dateStart || 0);
        const dateB = new Date(b.startDate || b.assignedAt || b.createdAt || b.dateStart || 0);
        return dateB - dateA;
      });
      
      setBookings(sortedBookings);
    } catch (error) {
      console.error('Error refetching bookings:', error);
    }
  };

  // Fetch bookings from backend API (desk-assignments, virtual-office-clients, and schedules)
  // Use stable dependencies (primitive values) instead of object references to prevent refresh loops
  // Extract stable primitive values from objects for dependency tracking
  const userId = currentUser?.uid || null;
  const userEmail = currentUser?.email?.toLowerCase() || '';
  const userFirstName = userInfo?.firstName?.toLowerCase() || '';
  const userLastName = userInfo?.lastName?.toLowerCase() || '';
  
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchBookings = async () => {
      setLoading(true);
      
      // Get user's full name from userInfo
      const userFullName = userInfo 
        ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim().toLowerCase()
        : '';
      
      try {
        // Fetch desk assignments from backend API
        const deskAssignmentsResponse = await api.get('/api/desk-assignments');
        const deskBookings = [];
        
        if (deskAssignmentsResponse.success && deskAssignmentsResponse.data) {
          deskAssignmentsResponse.data.forEach((assignmentData) => {
            const deskId = assignmentData.id;
            
            // Get email and name from assignment data
            const assignmentEmail = assignmentData.email?.toLowerCase() || '';
            const assignmentName = assignmentData.name?.toLowerCase() || '';
            
            // Check if this assignment belongs to current user
            const emailMatch = userEmail && assignmentEmail && assignmentEmail === userEmail;
            const nameMatch = userFullName && assignmentName && assignmentName === userFullName;
            const firstNameMatch = userFirstName && assignmentName && assignmentName.includes(userFirstName);
            const lastNameMatch = userLastName && assignmentName && assignmentName.includes(userLastName);
            
            const isUserAssignment = emailMatch || nameMatch || (firstNameMatch && lastNameMatch);
            
            if (isUserAssignment) {
              // Get desk ID from document ID or assignmentData.desk field
              const finalDeskId = assignmentData.desk || deskId;
              
              const booking = {
                ...assignmentData, // Spread first to get all assignment data
                id: finalDeskId, // Use finalDeskId as id
                type: 'desk', // Ensure type is 'desk'
                deskId: finalDeskId, // Ensure deskId is set with finalDeskId
                desk: finalDeskId, // Also set desk field for compatibility
                room: assignmentData.section || assignmentData.location || 'Dedicated Desk',
                section: assignmentData.section || finalDeskId.substring(0, 1), // Extract section from desk ID (e.g., "B23" -> "B")
                location: assignmentData.location || 'Alliance Global Tower',
                clientName: assignmentData.name || 'User',
                email: assignmentData.email || '',
                contactNumber: assignmentData.contactNumber || '',
                company: assignmentData.company || '',
                startDate: assignmentData.assignedAt || assignmentData.createdAt || assignmentData.updatedAt,
                createdAt: assignmentData.assignedAt || assignmentData.createdAt,
                status: 'approved', // Desk assignments are already approved
              };
              deskBookings.push(booking);
            }
          });
        }

        // Fetch virtual office clients for this user from backend API
        const virtualOfficeResponse = await api.get(`/api/virtual-office/user/${userId}`).catch(() => ({ success: false, data: [] }));
        const virtualOfficeBookings = [];
        
        if (virtualOfficeResponse.success && virtualOfficeResponse.data) {
          virtualOfficeResponse.data.forEach((clientData) => {
            const clientId = clientData.id;
            
            const booking = {
              id: clientId,
              type: 'virtual-office',
              room: 'Virtual Office',
              clientName: clientData.fullName || 'User',
              email: clientData.email || '',
              contactNumber: clientData.phoneNumber || '',
              company: clientData.company || '',
              position: clientData.position || '',
              startDate: clientData.dateStart || clientData.createdAt,
              createdAt: clientData.createdAt,
              status: 'active', // Virtual office clients are active
              ...clientData,
            };
            virtualOfficeBookings.push(booking);
          });
        }

        // Fetch schedules/bookings from backend API
        const schedulesResponse = await api.get(`/api/schedules/user/${userId}`);
        const scheduleBookings = [];
        
        if (schedulesResponse.success && schedulesResponse.data) {
          schedulesResponse.data.forEach((scheduleData) => {
            const booking = {
              id: scheduleData.id,
              type: 'privateroom',
              room: scheduleData.room || 'Private Room',
              roomId: scheduleData.roomId || '',
              clientName: scheduleData.clientName || 'User',
              email: scheduleData.email || '',
              contactNumber: scheduleData.contactNumber || '',
              startDate: scheduleData.startDate,
              endDate: scheduleData.endDate,
              startTime: scheduleData.startTime,
              endTime: scheduleData.endTime,
              createdAt: scheduleData.createdAt,
              status: scheduleData.status || 'pending',
              notes: scheduleData.notes || '',
              ...scheduleData,
            };
            scheduleBookings.push(booking);
          });
        }

        // Combine all bookings
        const allBookings = [...deskBookings, ...virtualOfficeBookings, ...scheduleBookings];

        // Remove duplicates based on document ID
        const uniqueBookings = allBookings.reduce((acc, booking) => {
          const existing = acc.find(b => b.id === booking.id && b.type === booking.type);
          if (!existing) {
            acc.push(booking);
          }
          return acc;
        }, []);

        // Sort by date (newest first)
        const sortedBookings = uniqueBookings.sort((a, b) => {
          const dateA = new Date(a.startDate || a.assignedAt || a.createdAt || a.dateStart || 0);
          const dateB = new Date(b.startDate || b.assignedAt || b.createdAt || b.dateStart || 0);
          return dateB - dateA;
        });
        
        setBookings(sortedBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchBookings();
    
    // Poll for updates every 15 minutes (increased to reduce Firestore reads)
    // Only poll when tab is visible to reduce unnecessary requests
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (bookingsIntervalRef.current) {
          clearInterval(bookingsIntervalRef.current);
          bookingsIntervalRef.current = null;
        }
      } else {
        // Only create interval if one doesn't already exist
        if (!bookingsIntervalRef.current) {
          fetchBookings(); // Fetch immediately when tab becomes visible
          bookingsIntervalRef.current = setInterval(fetchBookings, 900000); // 15 minutes
        }
      }
    };
    
    // Start polling if tab is visible (only if no interval exists)
    if (!document.hidden && !bookingsIntervalRef.current) {
      bookingsIntervalRef.current = setInterval(fetchBookings, 900000); // 15 minutes
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (bookingsIntervalRef.current) {
        clearInterval(bookingsIntervalRef.current);
        bookingsIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, userEmail, userFirstName, userLastName]); // Use stable primitive dependencies


  // Fetch rooms from backend API to get rental fee information
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/api/rooms');
        if (response.success && response.data) {
          setRooms(response.data);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setRooms([]);
      }
    };

    // Initial fetch
    fetchRooms();
    
    // Poll for updates every 15 minutes (increased to reduce Firestore reads)
    // Only poll when tab is visible to reduce unnecessary requests
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (roomsIntervalRef.current) {
          clearInterval(roomsIntervalRef.current);
          roomsIntervalRef.current = null;
        }
      } else {
        // Only create interval if one doesn't already exist
        if (!roomsIntervalRef.current) {
          fetchRooms(); // Fetch immediately when tab becomes visible
          roomsIntervalRef.current = setInterval(fetchRooms, 900000); // 15 minutes
        }
      }
    };
    
    // Start polling if tab is visible (only if no interval exists)
    if (!document.hidden && !roomsIntervalRef.current) {
      roomsIntervalRef.current = setInterval(fetchRooms, 900000); // 15 minutes
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

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⏳', label: 'Pending' },
      upcoming: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📅', label: 'Upcoming' },
      ongoing: { bg: 'bg-teal-100', text: 'text-teal-700', icon: '▶️', label: 'Ongoing' },
      active: { bg: 'bg-green-100', text: 'text-green-700', icon: '✓', label: 'Active' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', icon: '✓', label: 'Approved' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-700', icon: '✓', label: 'Confirmed' },
    };
    return styles[status?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📋', label: status || 'Pending' };
  };

  // Get room data for a booking
  const getRoomData = (roomId) => {
    return rooms.find(room => room.id === roomId) || null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Handle cancel/delete booking (only for private room schedules)
  const handleCancelBooking = async (booking) => {
    // Only allow canceling private room bookings (schedules)
    // Desk assignments and virtual office bookings are managed by admin
    if (booking.type !== 'privateroom') {
      showToast('This booking type cannot be canceled from here. Please contact support.', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to cancel this booking for ${booking.room}? This action cannot be undone.`)) {
      return;
    }

    setDeletingBookingId(booking.id);

    try {
      // Delete schedule via backend API
      const response = await api.delete(`/api/schedules/${booking.id}`);
      
      if (response.success) {
        // Optimistically remove booking from UI immediately
        setBookings(prevBookings => prevBookings.filter(b => 
          !(b.id === booking.id && b.type === booking.type)
        ));
        
        // Refetch bookings to ensure data is fresh and sync with backend
        try {
          await refetchBookings();
        } catch (refetchError) {
          console.error('Error refetching bookings after cancellation:', refetchError);
          // Don't show error to user since booking was already removed from UI
        }
        
        showToast('Booking canceled successfully!', 'success');
      } else {
        showToast(response.message || 'Failed to cancel booking. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error canceling booking:', error);
      
      let errorMessage = 'Failed to cancel booking. Please try again.';
      
      if (error.response?.status === 404) {
        // If booking not found, it might already be deleted - remove from UI
        setBookings(prevBookings => prevBookings.filter(b => 
          !(b.id === booking.id && b.type === booking.type)
        ));
        errorMessage = 'Booking not found. It may have already been canceled.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to cancel this booking.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setDeletingBookingId(null);
    }
  };


  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F766E] mx-auto mb-4"></div>
          <p className={`${roboto.className} text-gray-600`}>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className={`${leagueSpartan.className} text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 mb-2`}>
            Active Bookings
          </h1>
          <p className={`${roboto.className} text-gray-600 text-base lg:text-lg`}>
            View and manage your current reservations
          </p>
        </div>

        {/* Stats Card */}
        {bookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#0F766E] to-[#0d6b64] rounded-2xl p-6 mb-6 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={`${roboto.className} text-white/90 text-sm mb-1`}>Total Active Bookings</p>
                <p className={`${leagueSpartan.className} text-4xl font-bold text-white`}>{bookings.length}</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="flex items-center gap-2 text-white/90">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`${roboto.className} text-sm`}>All systems operational</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bookings Grid */}
        {bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm"
          >
            <div className="text-6xl mb-4">📅</div>
            <h3 className={`${leagueSpartan.className} text-2xl font-semibold text-slate-800 mb-2`}>
              No Active Bookings
            </h3>
            <p className={`${roboto.className} text-gray-600 max-w-md mx-auto`}>
              You don't have any active bookings at the moment. Book a room to get started!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bookings.map((booking, index) => {
              const status = getStatusBadge(booking.status);
              const roomData = getRoomData(booking.roomId);
              
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`${leagueSpartan.className} text-xl font-bold text-white`}>
                            {booking.room || (booking.type === 'desk' ? 'Dedicated Desk' : booking.type === 'virtual-office' ? 'Virtual Office' : 'Private Room')}
                          </h3>
                          {booking.type && (
                            <span className={`${roboto.className} text-xs px-2 py-0.5 rounded-full ${
                              booking.type === 'desk' 
                                ? 'bg-blue-500/20 text-blue-200' 
                                : booking.type === 'virtual-office'
                                ? 'bg-teal-500/20 text-teal-200'
                                : 'bg-purple-500/20 text-purple-200'
                            }`}>
                              {booking.type === 'desk' ? 'Desk' : booking.type === 'virtual-office' ? 'Virtual Office' : 'Private Room'}
                            </span>
                          )}
                        </div>
                        <p className={`${roboto.className} text-white/80 text-sm`}>
                          {booking.clientName || 'Booking'}
                        </p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap ${status.bg} ${status.text}`}>
                        <span>{status.icon}</span>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`${roboto.className} text-xs text-gray-500 mb-1`}>Start Date</p>
                        <p className={`${leagueSpartan.className} text-base font-semibold text-slate-800`}>
                          {formatDate(booking.startDate)}
                        </p>
                        {booking.startTime && (
                          <p className={`${roboto.className} text-sm text-gray-600 mt-1`}>
                            {booking.startTime}
                          </p>
                        )}
                      </div>
                      {booking.endDate && (
                        <div>
                          <p className={`${roboto.className} text-xs text-gray-500 mb-1`}>End Date</p>
                          <p className={`${leagueSpartan.className} text-base font-semibold text-slate-800`}>
                            {formatDate(booking.endDate)}
                          </p>
                          {booking.endTime && (
                            <p className={`${roboto.className} text-sm text-gray-600 mt-1`}>
                              {booking.endTime}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200"></div>

                    {/* Details Grid */}
                    <div className="space-y-3">
                      {booking.email && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className={`${roboto.className} text-xs text-gray-500`}>Email</p>
                            <p className={`${roboto.className} text-sm text-slate-800 truncate`}>{booking.email}</p>
                          </div>
                        </div>
                      )}

                      {booking.contactNumber && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <div className="flex-1">
                            <p className={`${roboto.className} text-xs text-gray-500`}>Contact</p>
                            <p className={`${roboto.className} text-sm text-slate-800`}>{booking.contactNumber}</p>
                          </div>
                        </div>
                      )}

                      {/* Desk ID - Always show for desk bookings (prominent position) */}
                      {booking.type === 'desk' && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="flex-1">
                            <p className={`${roboto.className} text-xs text-gray-500`}>Desk ID</p>
                            <p className={`${leagueSpartan.className} text-base font-semibold text-[#0F766E]`}>
                              {booking.deskId || booking.id || booking.desk || 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Show rental fee for private rooms, desk info for desks */}
                      {booking.type === 'privateroom' && roomData && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className={`${roboto.className} text-xs text-gray-500`}>Rental Fee</p>
                            <p className={`${leagueSpartan.className} text-base font-semibold text-[#0F766E]`}>
                              {getCurrencySymbol(roomData.currency || 'PHP')}{roomData.rentFee?.toLocaleString() || '0'} 
                              <span className={`${roboto.className} text-sm font-normal text-gray-600`}>
                                {' '}{roomData.rentFeePeriod || 'per hour'}
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {booking.type === 'desk' && booking.section && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className={`${roboto.className} text-xs text-gray-500`}>Section</p>
                            <p className={`${roboto.className} text-sm text-slate-800`}>{booking.section}</p>
                          </div>
                        </div>
                      )}
                      
                      {booking.type === 'desk' && booking.location && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div className="flex-1">
                            <p className={`${roboto.className} text-xs text-gray-500`}>Location</p>
                            <p className={`${roboto.className} text-sm text-slate-800`}>{booking.location}</p>
                          </div>
                        </div>
                      )}
                      
                      {booking.type === 'virtual-office' && booking.company && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div className="flex-1">
                            <p className={`${roboto.className} text-xs text-gray-500`}>Company</p>
                            <p className={`${roboto.className} text-sm text-slate-800`}>{booking.company}</p>
                          </div>
                        </div>
                      )}
                      
                      {booking.type === 'virtual-office' && booking.position && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1">
                            <p className={`${roboto.className} text-xs text-gray-500`}>Position</p>
                            <p className={`${roboto.className} text-sm text-slate-800`}>{booking.position}</p>
                          </div>
                        </div>
                      )}

                      {booking.createdAt && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1">
                            <p className={`${roboto.className} text-xs text-gray-500`}>Booked on</p>
                            <p className={`${roboto.className} text-sm text-slate-800`}>{formatDate(booking.createdAt)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes or Additional Info */}
                    {booking.notes && (
                      <>
                        <div className="border-t border-gray-200"></div>
                        <div>
                          <p className={`${roboto.className} text-xs text-gray-500 mb-1`}>Notes</p>
                          <p className={`${roboto.className} text-sm text-slate-700`}>{booking.notes}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons - Only show for private room bookings that can be canceled */}
                  {booking.type === 'privateroom' && (
                    <>
                      <div className="border-t border-gray-200"></div>
                      <div className="px-6 pb-6">
                        <button
                          onClick={() => handleCancelBooking(booking)}
                          disabled={deletingBookingId === booking.id}
                          className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            deletingBookingId === booking.id
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg'
                          }`}
                        >
                          {deletingBookingId === booking.id ? 'Canceling...' : 'Cancel Booking'}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
