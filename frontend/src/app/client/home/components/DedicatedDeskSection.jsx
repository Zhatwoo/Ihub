'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { League_Spartan } from 'next/font/google';
import { availableSpaces } from './DidicatedDesk';
import { api } from '@/lib/api';
import Part1 from '@/app/admin/dedicated-desk/components/parts/Part1';
import Part2 from '@/app/admin/dedicated-desk/components/parts/Part2';
import Part3 from '@/app/admin/dedicated-desk/components/parts/Part3';
import Part4 from '@/app/admin/dedicated-desk/components/parts/Part4';
import Part5 from '@/app/admin/dedicated-desk/components/parts/Part5';
import Part6 from '@/app/admin/dedicated-desk/components/parts/Part6';
import Part7 from '@/app/admin/dedicated-desk/components/parts/Part7';
import Part8 from '@/app/admin/dedicated-desk/components/parts/Part8';
import FloorPlanView from '@/app/admin/dedicated-desk/tabs/FloorPlan';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-league-spartan',
});

export default function DedicatedDeskSection() {
  const carouselRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFullFloorPlan, setShowFullFloorPlan] = useState(false);
  const [zoom, setZoom] = useState(0.4);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [deskAssignments, setDeskAssignments] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(0.6);

  // Handle responsive scaling for floor plan
  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScaleFactor(0.25);
      } else if (width < 1024) {
        setScaleFactor(0.4);
      } else {
        setScaleFactor(0.6);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Get current user from localStorage and fetch user info from backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user info from localStorage (set during login)
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser({ uid: user.uid, email: user.email });
          
          // Fetch user details from backend API
          try {
            const response = await api.get(`/api/accounts/client/users/${user.uid}`);
            if (response.success && response.data) {
              setUserInfo(response.data);
            }
          } catch (error) {
            // Handle 404 (user not found) gracefully - this is expected for new users
            // User may be authenticated but not yet have a document in accounts/client/users
            if (error.response?.status === 404) {
              // User not found in accounts collection - use basic info from localStorage
              setUserInfo({ email: user.email });
            } else {
              // Log other errors but still fallback to basic info
              console.error('Error fetching user info:', error);
              setUserInfo({ email: user.email });
            }
          }
        } else {
          setCurrentUser(null);
          setUserInfo(null);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setCurrentUser(null);
        setUserInfo(null);
      }
    };

    fetchUserData();
    
    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = () => {
      fetchUserData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch desk assignments from backend API
  const deskAssignmentsIntervalRef = useRef(null);
  
  useEffect(() => {
    const fetchDeskAssignments = async () => {
      try {
        const response = await api.get('/api/desk-assignments');
        if (response.success && response.data) {
          const assignments = {};
          response.data.forEach((assignment) => {
            assignments[assignment.id] = assignment;
          });
          setDeskAssignments(assignments);
        }
      } catch (error) {
        console.error('Error fetching desk assignments:', error);
        setDeskAssignments({});
      }
    };

    // Initial fetch
    fetchDeskAssignments();
    
    // Poll for updates every 30 seconds
    // Only poll when tab is visible to reduce unnecessary requests
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (deskAssignmentsIntervalRef.current) {
          clearInterval(deskAssignmentsIntervalRef.current);
          deskAssignmentsIntervalRef.current = null;
        }
      } else {
        // Only create interval if one doesn't already exist
        if (!deskAssignmentsIntervalRef.current) {
          fetchDeskAssignments(); // Fetch immediately when tab becomes visible
          deskAssignmentsIntervalRef.current = setInterval(fetchDeskAssignments, 30000);
        }
      }
    };
    
    // Start polling if tab is visible (only if no interval exists)
    if (!document.hidden && !deskAssignmentsIntervalRef.current) {
      deskAssignmentsIntervalRef.current = setInterval(fetchDeskAssignments, 30000);
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (deskAssignmentsIntervalRef.current) {
        clearInterval(deskAssignmentsIntervalRef.current);
        deskAssignmentsIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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

  const handleCardClick = (space) => {
    // Check if this is the "Click to View All Desks" card (id 9 or no image)
    if (space.id === 9 || !space.image) {
      // Show full floor plan modal
      setShowFullFloorPlan(true);
    } else if (space.image) {
      // Show section-specific modal
      setSelectedSpace(space);
      setIsModalOpen(true);
    }
  };

  const handleDeskClick = (deskTag) => {
    console.log('Desk clicked:', deskTag);
    setSelectedDesk(deskTag);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSpace(null);
    setSelectedDesk(null);
  };

  const closeFullFloorPlan = () => {
    setShowFullFloorPlan(false);
  };

  // Zoom handlers for full floor plan
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2.0));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.2));
  };

  const handleResetZoom = () => {
    setZoom(0.4);
  };

  // Submit desk request to backend API (which saves to Firestore database)
  const handleRequestDesk = async () => {
    if (!selectedDesk) {
      alert('Please select a desk first');
      return;
    }

    if (!currentUser) {
      alert('Please log in to request a desk');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare desk request data
      const requestData = {
        deskId: selectedDesk,
        section: selectedSpace?.title || '',
        location: selectedSpace?.location || '',
        requestDate: new Date().toISOString(),
        status: 'pending',
        occupantType: 'Tenant',
        // User info - flat structure for easy access
        firstName: userInfo?.firstName || '',
        lastName: userInfo?.lastName || '',
        email: userInfo?.email || currentUser.email || '',
        company: userInfo?.companyName || '',
        contact: userInfo?.contact || '',
        // Also include nested requestedBy for backward compatibility
        requestedBy: {
          userId: currentUser.uid,
          firstName: userInfo?.firstName || '',
          lastName: userInfo?.lastName || '',
          email: userInfo?.email || currentUser.email || '',
          companyName: userInfo?.companyName || '',
          contact: userInfo?.contact || '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to backend API: PUT /api/accounts/client/users/:userId/request/desk
      // Backend controller saves to Firestore at /accounts/client/users/{userId}/request/desk
      // Backend will create user document if it doesn't exist
      const response = await api.put(`/api/accounts/client/users/${currentUser.uid}/request/desk`, requestData);
      
      if (response.success) {
        alert(`Desk request for ${selectedDesk} has been submitted successfully!`);
        // Close modal after successful submission
        closeModal();
        // Reset selected desk for next request
        setSelectedDesk(null);
      } else {
        alert(response.message || 'Failed to submit desk request. Please try again.');
      }
    } catch (error) {
      console.error('Error saving desk request:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to submit desk request. Please try again.';
      
      if (error.response?.status === 404) {
        errorMessage = 'User account not found. Please try logging out and logging back in.';
      } else if (error.response?.status === 503) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the Part component based on section letter
  const getPartComponent = (sectionTitle) => {
    const sectionLetter = sectionTitle.replace('Section ', '').toUpperCase();
    const baseProps = {
      onDeskClick: handleDeskClick,
      tagPrefix: sectionLetter,
      deskAssignments: deskAssignments,
      zoom: 1,
      isStandalone: true,
      showPrivateInfo: false // Hide private info on client side
    };

    switch (sectionLetter) {
      case 'A':
        return <Part1 {...baseProps} />;
      case 'B':
        return <Part2 {...baseProps} startY={0} />;
      case 'C':
        return <Part3 {...baseProps} startX={0} />;
      case 'D':
        return <Part4 {...baseProps} startX={0} startY={115} wallAlignX={480} wallAlignY={0} />;
      case 'E':
        return <Part5 {...baseProps} startX={0} startY={40} wallAlignX={400} />;
      case 'F':
        return <Part6 {...baseProps} wallAlignX={350} wallAlignY={0} />;
      case 'G':
        return <Part7 {...baseProps} startX={0} startY={136} wallAlignX={400} />;
      case 'H':
        return <Part8 {...baseProps} startX={0} startY={140} wallAlignX={320} wallAlignY={0} />;
      default:
        return <Part1 {...baseProps} />;
    }
  };

  return (
    <section className="pt-8 pb-8" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-[90%] mx-auto px-4">
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`${leagueSpartan.className} text-3xl font-bold text-slate-800`}>Dedicated Desk</h2>
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
            {availableSpaces.map((space) => (
              <div
                key={space.id}
                onClick={() => handleCardClick(space)}
                className={`shrink-0 w-[300px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:ring-2 hover:ring-teal-500 transition-all duration-300 cursor-pointer group relative ${!space.image ? 'flex flex-col' : ''}`}
              >
                {space.image ? (
                  <div className="relative h-[200px]">
                    <Image
                      src={space.image}
                      alt={space.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-[200px]">
                    <h3 className="text-lg font-semibold text-slate-800 text-center px-4">{space.title}</h3>
                  </div>
                )}
                {space.image && (
                  <div className="p-4 bg-white">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{space.title}</h3>
                    <p className="text-sm text-gray-600 mb-1">{space.location}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedSpace && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-2 sm:p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className={`${leagueSpartan.className} text-lg sm:text-xl md:text-2xl font-bold text-slate-800 truncate`}>
                  {selectedSpace.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedSpace.location}</p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Responsive Split Layout */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* Left Side - Desk Layout */}
              <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto min-h-[300px] sm:min-h-[400px] lg:min-h-0">
                <div 
                  className="relative bg-gray-50 rounded-lg overflow-auto flex items-center justify-center border-2 border-blue-500" 
                  style={{ 
                    minHeight: '300px',
                    height: '100%',
                    maxHeight: 'calc(95vh - 200px)',
                    backgroundImage: "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                  }}
                >
                  <div 
                    className="relative" 
                    style={{ 
                      width: '1400px', 
                      height: '1000px',
                      transform: `scale(${scaleFactor})`,
                      transformOrigin: 'center center'
                    }}
                  >
                    {getPartComponent(selectedSpace.title)}
                  </div>
                </div>
              </div>

              {/* Right Side - Desk Info and CTA */}
              <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 sm:p-6 flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <h3 className={`${leagueSpartan.className} text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4`}>
                    Desk Information
                  </h3>
                  
                  {/* Selected Desk Display */}
                  {selectedDesk ? (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Selected Desk</p>
                      <p className={`${leagueSpartan.className} text-xl sm:text-2xl font-bold text-teal-700`}>
                        {selectedDesk}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs sm:text-sm text-gray-500 text-center">
                        Click on a desk to select
                      </p>
                    </div>
                  )}

                  {/* Desk Location */}
                  <div className="mb-4 sm:mb-6">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">Location</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-800">
                      {selectedSpace.location}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {selectedSpace.title}
                    </p>
                  </div>

                  {/* Section Info */}
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">Section Details</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">Section:</span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800">{selectedSpace.title}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">Rating:</span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800">{selectedSpace.rating} ⭐</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">Status:</span>
                        <span className="text-xs sm:text-sm font-semibold text-green-600">Available</span>
                      </div>
                    </div>
                  </div>

                  {/* Photo/Image Display */}
                  <div className="mb-4 sm:mb-6">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">Section Photo</p>
                    <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden border-2 sm:border-4 border-purple-500">
                      <Image
                        src={selectedSpace.image}
                        alt={selectedSpace.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-4 sm:mt-auto pt-4 sm:pt-6 border-t border-gray-200">
                  <button
                    onClick={handleRequestDesk}
                    disabled={!selectedDesk || isSubmitting || !currentUser}
                    className={`w-full py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${
                      selectedDesk && !isSubmitting && currentUser
                        ? 'bg-[#0F766E] text-white hover:bg-[#0d6b64] shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting 
                      ? 'Submitting...' 
                      : !currentUser 
                        ? 'Please Log In' 
                        : `Request Desk ${selectedDesk || ''}`
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Floor Plan Modal */}
      {showFullFloorPlan && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closeFullFloorPlan}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-[95vw] w-full max-h-[95vh] overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between z-10 shrink-0">
              <div className="flex-1">
                <h2 className={`${leagueSpartan.className} text-2xl font-bold text-slate-800`}>
                  Full Floor Plan - All Desks
                </h2>
                <p className="text-sm text-gray-600 mt-1">View all available desks across all sections</p>
              </div>
              <button
                onClick={closeFullFloorPlan}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all shrink-0"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Floor Plan Content */}
            <div className="flex-1 overflow-hidden">
              <FloorPlanView
                zoom={zoom}
                handleZoomIn={handleZoomIn}
                handleZoomOut={handleZoomOut}
                handleResetZoom={handleResetZoom}
                handleDeskClick={handleDeskClick}
                deskAssignments={deskAssignments}
                isLoaded={true}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

