'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { League_Spartan } from 'next/font/google';
import { useTranslation } from '@/lib/TranslationContext';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-league-spartan',
});

const amenityKeys = [
  { id: 1, titleKey: 'client.amenitiesSection.modernPantry', descKey: 'client.amenitiesSection.modernPantryDesc', image: '/images/IMG_5337.jpg' },
  { id: 2, titleKey: 'client.amenitiesSection.refrigeratorStorage', descKey: 'client.amenitiesSection.refrigeratorStorageDesc', image: '/images/IMG_5335.jpg' },
  { id: 3, titleKey: 'client.amenitiesSection.scenicViews', descKey: 'client.amenitiesSection.scenicViewsDesc', image: '/images/IMG_5334.jpg' },
  { id: 4, titleKey: 'client.amenitiesSection.coworkingSpace', descKey: 'client.amenitiesSection.coworkingSpaceDesc', image: '/images/IMG_5333.jpg' },
  { id: 5, titleKey: 'client.amenitiesSection.relaxationArea', descKey: 'client.amenitiesSection.relaxationAreaDesc', image: '/images/IMG_5331.jpg' },
  { id: 6, titleKey: 'client.amenitiesSection.waitingLounge', descKey: 'client.amenitiesSection.waitingLoungeDesc', image: '/images/IMG_5328.jpg' },
  { id: 8, titleKey: 'client.amenitiesSection.personalLockers', descKey: 'client.amenitiesSection.personalLockersDesc', image: '/images/IMG_5325.jpg' },
  { id: 9, titleKey: 'client.amenitiesSection.communalArea', descKey: 'client.amenitiesSection.communalAreaDesc', image: '/images/IMG_5326.jpg' },
];

export default function AmenitiesSection() {
  const { t } = useTranslation();
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

  const getAmenityTitle = (a) => t(a.titleKey);
  const getAmenityDesc = (a) => t(a.descKey);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAmenity(null);
  };

  return (
    <section className="pt-8 pb-8 bg-white">
      <div className="max-w-[90%] mx-auto px-4">
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`${leagueSpartan.className} text-3xl font-bold text-slate-800`}>{t('client.amenitiesSection.title')}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => scrollCarousel('left')}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label={t('client.amenitiesSection.scrollLeft')}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label={t('client.amenitiesSection.scrollRight')}
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
            {amenityKeys.map((amenity) => (
              <div
                key={amenity.id}
                onClick={() => handleCardClick(amenity)}
                className="shrink-0 w-[300px] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group relative"
              >
                <div className="relative h-[200px]">
                  <Image
                    src={amenity.image}
                    alt={getAmenityTitle(amenity)}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </div>
                <div className="p-4 bg-white">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{getAmenityTitle(amenity)}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{getAmenityDesc(amenity)}</p>
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
                  {getAmenityTitle(selectedAmenity)}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{getAmenityDesc(selectedAmenity)}</p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0 text-gray-400 hover:text-gray-600"
                aria-label={t('client.amenitiesSection.closeModal')}
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
                  alt={getAmenityTitle(selectedAmenity)}
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

