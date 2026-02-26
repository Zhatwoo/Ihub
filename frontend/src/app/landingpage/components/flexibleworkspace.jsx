'use client';

import Image from 'next/image';
import { League_Spartan, Roboto } from 'next/font/google';
import {
  ThreeDScrollTriggerContainer,
  ThreeDScrollTriggerColumn,
} from './ThreeDScrollTriggerVertical';
import { useTranslation } from '@/lib/TranslationContext';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-league-spartan',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
});

export default function FlexibleWorkspace() {
  const { t } = useTranslation();
  return (
    <section className="relative bg-[#F8FAFC] overflow-hidden">
      <ThreeDScrollTriggerContainer>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Main Content Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center">
            {/* Left Side - Two Columns of Scrolling Images */}
            <div className="flex gap-2 sm:gap-4 h-[250px] sm:h-[300px] lg:h-[350px]">
              {/* Column 1 - Scrolling Down */}
              <div className="flex-1 h-full">
                <ThreeDScrollTriggerColumn baseVelocity={5} direction={1}>
                  {/* Image 1 */}
                  <div className="relative w-full h-[150px] sm:h-[180px] lg:h-[220px] rounded-lg sm:rounded-xl overflow-hidden border-2 sm:border-4 border-white shrink-0 mb-2 sm:mb-4">
                    <Image
                      src="/images/IMG_5265.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Image 2 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/DESK/part1/IMG_1112.JPG"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Image 3 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5266.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Image 4 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/DESK/part1/IMG_1114.JPG"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Image 5 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5268.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Image 6 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/DESK/part2/IMG_1120.JPG"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                </ThreeDScrollTriggerColumn>
              </div>

              {/* Column 2 - Scrolling Up */}
              <div className="flex-1 h-full">
                <ThreeDScrollTriggerColumn baseVelocity={5} direction={-1}>
                  {/* Image 1 */}
                  <div className="relative w-full h-[150px] sm:h-[180px] lg:h-[220px] rounded-lg sm:rounded-xl overflow-hidden border-2 sm:border-4 border-white shrink-0 mb-2 sm:mb-4">
                    <Image
                      src="/images/IMG_5283.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Image 2 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/DESK/part2/IMG_1125.JPG"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Image 3 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5286.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Image 4 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/DESK/part3/IMG_1128.JPG"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Image 5 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5299.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Image 6 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/DESK/part5/IMG_1134.JPG"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                </ThreeDScrollTriggerColumn>
              </div>
            </div>

          {/* Right Column - Text Content */}
          <div className="space-y-2 sm:space-y-3 ml-0 lg:ml-[30%] text-left lg:text-right scale-100 lg:scale-[1.2] mt-4 lg:mt-0">
            <div>
              <h2 className={`${leagueSpartan.className} text-xl sm:text-2xl lg:text-3xl font-bold text-[#1F2937] mb-2`}>
                {t('landing.flexibleWorkspace.heading')}
              </h2>
              <div className="w-20 sm:w-24 h-1 bg-[#0F766E] lg:ml-auto"></div>
            </div>
            <p className={`${roboto.className} text-sm sm:text-base lg:text-lg text-[#1F2937] leading-relaxed max-w-lg lg:ml-auto`}>
              {t('landing.flexibleWorkspace.body')}
            </p>
          </div>
        </div>
      </div>
      </ThreeDScrollTriggerContainer>
    </section>
  );
}
