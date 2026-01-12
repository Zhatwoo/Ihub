import Image from 'next/image';
import { League_Spartan, Roboto } from 'next/font/google';
import {
  ThreeDScrollTriggerContainer,
  ThreeDScrollTriggerColumn,
} from './ThreeDScrollTriggerVertical';

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
  return (
    <section className="relative bg-[#F8FAFC] overflow-hidden">
      <ThreeDScrollTriggerContainer>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 lg:py-8">
          {/* Main Content Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left Side - Two Columns of Scrolling Images */}
            <div className="flex gap-4 h-[300px] lg:h-[350px]">
              {/* Column 1 - Scrolling Down */}
              <div className="flex-1 h-full">
                <ThreeDScrollTriggerColumn baseVelocity={5} direction={1}>
                  {/* Image 1 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5265.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Image 2 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5266.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Image 3 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5268.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Image 4 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5269.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Image 5 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5270.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Image 6 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5275.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </ThreeDScrollTriggerColumn>
              </div>

              {/* Column 2 - Scrolling Up */}
              <div className="flex-1 h-full">
                <ThreeDScrollTriggerColumn baseVelocity={5} direction={-1}>
                  {/* Image 1 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5283.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Image 2 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5286.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Image 3 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5299.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Image 4 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5296.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Image 5 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5307.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Image 6 */}
                  <div className="relative w-full h-[200px] lg:h-[220px] rounded-xl overflow-hidden border-4 border-white shrink-0 mb-4">
                    <Image
                      src="/images/IMG_5320.jpg"
                      alt="Office workspace"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </ThreeDScrollTriggerColumn>
              </div>
            </div>

          {/* Right Column - Text Content */}
          <div className="space-y-3 ml-[30%] text-right scale-[1.2]">
            <div>
              <h2 className={`${leagueSpartan.className} text-2xl lg:text-3xl font-bold text-[#1F2937] mb-2`}>
                Flexible Workspaces for Modern Professionals
              </h2>
              <div className="w-24 h-1 bg-[#0F766E] ml-auto"></div>
            </div>
            <p className={`${roboto.className} text-base lg:text-lg text-[#1F2937] leading-relaxed max-w-lg ml-auto`}>
              Whether you're a freelancer, a startup, or remote team, our beautifully furnished desks are ready to support your productivity. Enjoy a comfortable environment, and a vibrant community all at an affordable rate.
            </p>
          </div>
        </div>
      </div>
      </ThreeDScrollTriggerContainer>
    </section>
  );
}
