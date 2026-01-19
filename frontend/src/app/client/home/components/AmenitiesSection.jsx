'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { League_Spartan } from 'next/font/google';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-league-spartan',
});

const amenities = [
  {
    id: 1,
    title: 'Modern Pantry',
    description: 'Fully equipped kitchen with modern appliances and dining area.',
    image: '/images/IMG_5337.jpg'
  },
  {
    id: 2,
    title: 'Refrigerator & Storage',
    description: 'Commercial-grade refrigerator and storage facilities for your convenience.',
    image: '/images/IMG_5335.jpg'
  },
  {
    id: 3,
    title: 'Scenic Views',
    description: 'Spacious areas with panoramic city views and natural lighting.',
    image: '/images/IMG_5334.jpg'
  },
  {
    id: 4,
    title: 'Co-working Space',
    description: 'Modern co-working area with comfortable seating and work tables.',
    image: '/images/IMG_5333.jpg'
  },
  {
    id: 5,
    title: 'Relaxation Area',
    description: 'Comfortable lounge area with recliners for rest and relaxation.',
    image: '/images/IMG_5331.jpg'
  },
  {
    id: 6,
    title: 'Waiting Lounge',
    description: 'Professional waiting area with comfortable seating.',
    image: '/images/IMG_5328.jpg'
  },
  {
    id: 8,
    title: 'Personal Lockers',
    description: 'Secure personal storage lockers for your belongings.',
    image: '/images/IMG_5325.jpg'
  },
  {
    id: 9,
    title: 'Communal Area',
    description: 'Spacious communal space with modern amenities and seating.',
    image: '/images/IMG_5326.jpg'
  }
];

export default function AmenitiesSection() {
  const carouselRef = useRef(null);
  const [selectedAmenity, setSelectedAmenity] = useState(null);
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

  const handleCardClick = (amenity) => {
    setSelectedAmenity(amenity);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAmenity(null);
  };

  return (
    <section className="pt-8 pb-8 bg-white">
      <div className="max-w-[90%] mx-auto px-4">
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`${leagueSpartan.className} text-3xl font-bold text-slate-800`}>Amenities</h2>
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
            {amenities.map((amenity) => (
              <div
                key={amenity.id}
                onClick={() => handleCardClick(amenity)}
                className="shrink-0 w-[300px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group relative"
              >
                <div className="relative h-[200px]">
                  <Image
                    src={amenity.image}
                    alt={amenity.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>
                <div className="p-4 bg-white">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{amenity.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{amenity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Photo Modal - Modern Minimalist Design */}
      {isModalOpen && selectedAmenity && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-3xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Minimalist Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10 shrink-0">
              <div className="flex-1">
                <h2 className={`${leagueSpartan.className} text-2xl font-semibold text-slate-900 tracking-tight`}>
                  {selectedAmenity.title}
                </h2>
                {selectedAmenity.description && (
                  <p className="text-gray-500 text-sm mt-1">{selectedAmenity.description}</p>
                )}
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

            {/* Image Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="relative w-full h-[70vh] min-h-[400px]">
                <Image
                  src={selectedAmenity.image}
                  alt={selectedAmenity.title}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

