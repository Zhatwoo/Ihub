'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { League_Spartan } from 'next/font/google';
import { usePrivateOffices } from './privateOffices';

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
            ) : rooms.length === 0 ? (
              <div className="flex items-center justify-center w-full py-12">
                <p className="text-gray-500">No private offices available</p>
              </div>
            ) : (
              rooms.map((feature, index) => (
                <div
                  key={feature.id}
                  onClick={() => handleCardClick(feature)}
                  className="flex-shrink-0 w-[300px] rounded-2xl overflow-hidden cursor-pointer group relative transition-all duration-300 shadow-md hover:shadow-2xl hover:ring-2 hover:ring-teal-500"
                >
                  <div className="relative h-[200px]">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
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

      {/* Private Office Details Modal */}
      {isModalOpen && selectedRoom && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden relative flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className={`${leagueSpartan.className} text-2xl font-bold text-slate-800`}>
                  {selectedRoom.title || selectedRoom.name}
                </h2>
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

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Image */}
              <div className="relative w-full h-64 rounded-lg overflow-hidden mb-6 border-4 border-teal-500">
                <Image
                  src={selectedRoom.image}
                  alt={selectedRoom.title || selectedRoom.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Office Information */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Office Name</span>
                  <span className="text-slate-800 text-xl font-semibold">{selectedRoom.title || selectedRoom.name}</span>
                </div>

                <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Rental Fee</span>
                  <span className="text-slate-800 text-xl font-semibold">
                    {getCurrencySymbol(selectedRoom.currency || 'PHP')}
                    {selectedRoom.rentFee?.toLocaleString() || '0'} {selectedRoom.rentFeePeriod || 'per hour'}
                  </span>
                </div>

                {selectedRoom.description && (
                  <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                    <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Description</span>
                    <span className="text-slate-800 text-lg whitespace-pre-line">{selectedRoom.description}</span>
                  </div>
                )}

                {selectedRoom.inclusions && (
                  <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl">
                    <span className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Inclusions</span>
                    <span className="text-slate-800 text-lg whitespace-pre-line">{selectedRoom.inclusions}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

