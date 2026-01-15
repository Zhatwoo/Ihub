'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { League_Spartan } from 'next/font/google';
import { availableSpaces } from './DidicatedDesk';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Part1 from '@/app/admin/dedicated-desk/components/parts/Part1';
import Part2 from '@/app/admin/dedicated-desk/components/parts/Part2';
import Part3 from '@/app/admin/dedicated-desk/components/parts/Part3';
import Part4 from '@/app/admin/dedicated-desk/components/parts/Part4';
import Part5 from '@/app/admin/dedicated-desk/components/parts/Part5';
import Part6 from '@/app/admin/dedicated-desk/components/parts/Part6';
import Part7 from '@/app/admin/dedicated-desk/components/parts/Part7';
import Part8 from '@/app/admin/dedicated-desk/components/parts/Part8';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-league-spartan',
});

export default function DedicatedDeskSection() {
  const carouselRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [deskAssignments, setDeskAssignments] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current user
  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // Fetch user info from Firestore
      if (user && db) {
        try {
          const userDocRef = doc(collection(db, 'accounts', 'client', 'users'), user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserInfo(userDoc.data());
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      } else {
        setUserInfo(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch desk assignments from Firebase
  useEffect(() => {
    if (!db) return;
    
    const unsubscribe = onSnapshot(collection(db, 'desk-assignments'), (snapshot) => {
      const assignments = {};
      snapshot.forEach((doc) => {
        assignments[doc.id] = doc.data();
      });
      setDeskAssignments(assignments);
    });

    return () => unsubscribe();
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
    if (space.image) { // Only open modal if it has an image (not the "Click to book" card)
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

  const handleRequestDesk = async () => {
    if (!selectedDesk) {
      alert('Please select a desk first');
      return;
    }

    if (!currentUser) {
      alert('Please log in to request a desk');
      return;
    }

    if (!db) {
      alert('Database connection error. Please try again later.');
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
        // User basic info
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

      // Save to /accounts/client/users/{userId}/request/desk
      const requestDocRef = doc(
        collection(db, 'accounts', 'client', 'users', currentUser.uid, 'request'),
        'desk'
      );

      await setDoc(requestDocRef, requestData, { merge: true });

      alert(`Desk request for ${selectedDesk} has been submitted successfully!`);
      
      // Close modal after successful submission
      closeModal();
    } catch (error) {
      console.error('Error saving desk request:', error);
      alert('Failed to submit desk request. Please try again.');
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
                className={`flex-shrink-0 w-[300px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:ring-2 hover:ring-teal-500 transition-all duration-300 cursor-pointer group relative ${!space.image ? 'flex flex-col' : ''}`}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className={`${leagueSpartan.className} text-2xl font-bold text-slate-800`}>
                  {selectedSpace.title}
                </h2>
                <p className="text-sm text-gray-600">{selectedSpace.location}</p>
              </div>
              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Split Layout */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Side - Desk Layout */}
              <div className="flex-1 p-6 overflow-auto">
                <div 
                  className="relative bg-gray-50 rounded-lg overflow-auto flex items-center justify-center border-2 border-blue-500" 
                  style={{ 
                    minHeight: '600px', 
                    maxHeight: '70vh',
                    backgroundImage: "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                  }}
                >
                  <div 
                    className="relative" 
                    style={{ 
                      width: '1400px', 
                      height: '1000px',
                      transform: 'scale(0.6)',
                      transformOrigin: 'center center'
                    }}
                  >
                    {getPartComponent(selectedSpace.title)}
                  </div>
                </div>
              </div>

              {/* Right Side - Desk Info and CTA */}
              <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col">
                <div className="flex-1">
                  <h3 className={`${leagueSpartan.className} text-xl font-bold text-slate-800 mb-4`}>
                    Desk Information
                  </h3>
                  
                  {/* Selected Desk Display */}
                  {selectedDesk ? (
                    <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <p className="text-sm text-gray-600 mb-1">Selected Desk</p>
                      <p className={`${leagueSpartan.className} text-2xl font-bold text-teal-700`}>
                        {selectedDesk}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500 text-center">
                        Click on a desk to select
                      </p>
                    </div>
                  )}

                  {/* Desk Location */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Location</p>
                    <p className="text-base font-semibold text-slate-800">
                      {selectedSpace.location}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedSpace.title}
                    </p>
                  </div>

                  {/* Section Info */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Section Details</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Section:</span>
                        <span className="text-sm font-semibold text-slate-800">{selectedSpace.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Rating:</span>
                        <span className="text-sm font-semibold text-slate-800">{selectedSpace.rating} ⭐</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className="text-sm font-semibold text-green-600">Available</span>
                      </div>
                    </div>
                  </div>

                  {/* Photo/Image Display */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Section Photo</p>
                    <div className="relative w-full h-64 rounded-lg overflow-hidden border-4 border-purple-500">
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
                <div className="mt-auto pt-6 border-t border-gray-200">
                  <button
                    onClick={handleRequestDesk}
                    disabled={!selectedDesk || isSubmitting || !currentUser}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
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
    </section>
  );
}

