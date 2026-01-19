'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, where, getDocs, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { League_Spartan, Roboto } from 'next/font/google';
import { motion } from 'framer-motion';

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

  // Get current user and user info
  useEffect(() => {
    if (!auth || !db) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // Fetch user info from Firestore
      if (user) {
        try {
          // Try path: accounts/client/users/{userId}/info/details
          const userInfoRef = doc(db, 'accounts', 'client', 'users', user.uid, 'info', 'details');
          const directSnap = await getDoc(userInfoRef);
          if (directSnap.exists()) {
            setUserInfo(directSnap.data());
          } else {
            // Try collection path
            const infoCollectionRef = collection(db, 'accounts', 'client', 'users', user.uid, 'info');
            const infoSnap = await getDocs(infoCollectionRef);
            if (!infoSnap.empty) {
              setUserInfo(infoSnap.docs[0].data());
            }
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [db]);

  // Currency symbol helper
  const getCurrencySymbol = (currency) => {
    const symbols = {
      'PHP': '₱', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
      'AUD': 'A$', 'CAD': 'C$', 'CNY': '¥', 'INR': '₹', 'SGD': 'S$'
    };
    return symbols[currency] || '₱';
  };

  // Fetch bookings from desk-assignments and virtual-office-clients collections
  useEffect(() => {
    if (!db || !currentUser) {
      if (!currentUser) {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const userId = currentUser.uid;
    const userEmail = currentUser.email?.toLowerCase() || '';
    
    // Get user's full name from userInfo or construct from firstName/lastName
    const userFullName = userInfo 
      ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim().toLowerCase()
      : '';
    const userFirstName = userInfo?.firstName?.toLowerCase() || '';
    const userLastName = userInfo?.lastName?.toLowerCase() || '';
    
    let deskBookings = [];
    let virtualOfficeBookings = [];
    let deskLoaded = false;
    let virtualOfficeLoaded = false;

    const updateBookings = () => {
      if (!deskLoaded || !virtualOfficeLoaded) return;

      const allBookings = [...deskBookings, ...virtualOfficeBookings];

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
      
      // Debug logs (can be removed in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('\n=== FINAL BOOKINGS SUMMARY ===');
        console.log(`Desk bookings: ${deskBookings.length}`);
        console.log(`Virtual office bookings: ${virtualOfficeBookings.length}`);
        console.log(`Total unique bookings: ${sortedBookings.length}`);
        console.log('=== END SUMMARY ===\n');
      }
      
      setBookings(sortedBookings);
      setLoading(false);
    };

    // Fetch from desk-assignments collection
    const deskAssignmentsRef = collection(db, 'desk-assignments');
    const unsubscribeDesk = onSnapshot(deskAssignmentsRef, (snapshot) => {
      deskLoaded = true;
      deskBookings = [];

      snapshot.docs.forEach((docSnapshot) => {
        const assignmentData = docSnapshot.data();
        const deskId = docSnapshot.id;
        
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

      updateBookings();
    }, (error) => {
      console.error('Error fetching desk-assignments:', error);
      deskLoaded = true;
      updateBookings();
    });

    // Fetch from virtual-office-clients collection
    const virtualOfficeRef = collection(db, 'virtual-office-clients');
    const unsubscribeVirtualOffice = onSnapshot(virtualOfficeRef, (snapshot) => {
      virtualOfficeLoaded = true;
      virtualOfficeBookings = [];

      snapshot.docs.forEach((docSnapshot) => {
        const clientData = docSnapshot.data();
        const clientId = docSnapshot.id;
        
        // Get email and name from client data
        const clientEmail = clientData.email?.toLowerCase() || '';
        const clientFullName = clientData.fullName?.toLowerCase() || '';
        
        // Check if this client belongs to current user
        const emailMatch = userEmail && clientEmail && clientEmail === userEmail;
        const nameMatch = userFullName && clientFullName && clientFullName === userFullName;
        const firstNameMatch = userFirstName && clientFullName && clientFullName.includes(userFirstName);
        const lastNameMatch = userLastName && clientFullName && clientFullName.includes(userLastName);
        
        const isUserClient = emailMatch || nameMatch || (firstNameMatch && lastNameMatch);
        
        if (isUserClient) {
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
        }
      });

      updateBookings();
    }, (error) => {
      console.error('Error fetching virtual-office-clients:', error);
      virtualOfficeLoaded = true;
      updateBookings();
    });

    return () => {
      unsubscribeDesk();
      unsubscribeVirtualOffice();
    };
  }, [currentUser, userInfo]);

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
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
