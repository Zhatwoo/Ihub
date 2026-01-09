import Image from 'next/image';

export default function TrustedPartners() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-[#1F2937] mb-4">
            Our Trusted Partners
          </h2>
          <div className="w-32 h-1 bg-[#0F766E] mx-auto"></div>
        </div>

        {/* Logos Grid */}
        <div className="space-y-12 lg:space-y-16">
          {/* Top Row - 4 Logos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 items-center justify-items-center">
            {/* SMDC */}
            <div className="flex items-center justify-center w-full h-20 relative">
              <Image
                src="/LOGOS/SMDC.png"
                alt="SMDC Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Vista Land */}
            <div className="flex items-center justify-center w-full h-20 relative">
              <Image
                src="/LOGOS/Vista Land.png"
                alt="Vista Land Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* Alliance Global */}
            <div className="flex items-center justify-center w-full h-20 relative">
              <Image
                src="/LOGOS/Alliance Global.png"
                alt="Alliance Global Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* AyalaLand */}
            <div className="flex items-center justify-center w-full h-20 relative">
              <Image
                src="/LOGOS/Ayala land.png"
                alt="AyalaLand Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          {/* Bottom Row - 3 Logos Centered */}
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
            {/* Megaworld International */}
            <div className="flex items-center justify-center w-full sm:w-[200px] lg:w-[250px] h-20 relative">
              <Image
                src="/LOGOS/Megaworld.png"
                alt="Megaworld International Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* UnionBank */}
            <div className="flex items-center justify-center w-full sm:w-[200px] lg:w-[250px] h-20 relative">
              <Image
                src="/LOGOS/UB.png"
                alt="UnionBank Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            {/* GM Fastcash Lending Corporation */}
            <div className="flex items-center justify-center w-full sm:w-[200px] lg:w-[250px] h-20 relative">
              <Image
                src="/LOGOS/GM.png"
                alt="GM Fastcash Lending Corporation Logo"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
