import Image from 'next/image';

export default function WhatYouGot({ children }) {
  return (
    <section className="w-full bg-[#F8FAFC] min-h-[70vh] relative">
      {/* What You Get Heading */}
      <div className="w-full flex items-center justify-center pt-16 pb-8">
        <div className="flex items-center gap-3">
          {/* Orange Star Icon */}
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#FF6B35" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="shrink-0"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {/* What You Get Text */}
          <h2 className="text-gray-800 text-4xl font-bold">What You Get</h2>
        </div>
      </div>
      {/* Cards Container */}
      <div className="w-full flex justify-center items-stretch gap-6 flex-wrap px-8 py-8 pb-22 relative z-10">
        {/* Card 1: Your Address */}
        <div className="w-[322px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col relative z-10 transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-2 hover:shadow-2xl cursor-pointer">
          {/* Top Section - Dark Teal */}
          <div className="w-full h-[230px] bg-[#0F766E] flex items-center justify-center p-6 relative">
            <Image
              src="/bg/What you get/Your address.png"
              alt="Your Address"
              fill
              className="object-contain"
            />
          </div>
          {/* Bottom Section - White */}
          <div className="w-full p-6 bg-white flex-1 flex flex-col">
            <h3 className="text-gray-800 text-xl font-bold mb-3">Your Address</h3>
            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Your address becomes 6F Alliance Global Tower, 11th Avenue, corner 36th St, Taguig, Metro Manila – to use on your website and business collateral. A great address should improve your SEO rankings.
            </p>
          </div>
        </div>

        {/* Card 2: Local Phone Number */}
        <div className="w-[322px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col relative z-10 transition-all duration-300 ease-in-out hover:rotate-2 hover:shadow-[0_0_30px_rgba(244,164,96,0.5)] cursor-pointer">
          {/* Top Section - Light Beige/Orange */}
          <div className="w-full h-[230px] bg-[#F4A460] flex items-center justify-center p-6 relative">
            <Image
              src="/bg/What you get/Loclal phone number.png"
              alt="Local Phone Number"
              fill
              className="object-contain"
            />
          </div>
          {/* Bottom Section - White */}
          <div className="w-full p-6 bg-white flex-1 flex flex-col">
            <h3 className="text-gray-800 text-xl font-bold mb-3">Local Phone Number</h3>
            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Local phone number with dedicated receptionists to answer your calls the way you would like and extend them to you wherever you are.
            </p>
          </div>
        </div>

        {/* Card 3: On-Site Support */}
        <div className="w-[322px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col relative z-10 transition-all duration-300 ease-in-out hover:-translate-y-3 hover:shadow-[0_20px_40px_rgba(135,206,235,0.3)] cursor-pointer">
          {/* Top Section - Light Blue */}
          <div className="w-full h-[230px] bg-[#87CEEB] flex items-center justify-center p-6 relative">
            <Image
              src="/bg/What you get/Support.png"
              alt="On-Site Support"
              fill
              className="object-contain"
            />
          </div>
          {/* Bottom Section - White */}
          <div className="w-full p-6 bg-white flex-1 flex flex-col">
            <h3 className="text-gray-800 text-xl font-bold mb-3">On-Site Support</h3>
            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Secretaries and in-house IT support team available to assist your business on-site.
            </p>
          </div>
        </div>

        {/* Card 4: Mobile Business Phone */}
        <div className="w-[322px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col relative z-10 transition-all duration-300 ease-in-out hover:scale-110 hover:-rotate-1 hover:shadow-[0_0_40px_rgba(65,105,225,0.4)] cursor-pointer">
          {/* Top Section - Bright Blue */}
          <div className="w-full h-[230px] bg-[#4169E1] flex items-center justify-center p-6 relative">
            <Image
              src="/bg/What you get/MObile business.png"
              alt="Mobile Business Phone"
              fill
              className="object-contain"
            />
          </div>
          {/* Bottom Section - White */}
          <div className="w-full p-6 bg-white flex-1 flex flex-col">
            <h3 className="text-gray-800 text-xl font-bold mb-3">Mobile Business Phone</h3>
            <p className="text-gray-700 text-sm leading-relaxed flex-1">
              Take your business phone on your mobile anywhere outside your home location.
            </p>
          </div>
        </div>
      </div>

      {children}
      {/* Diagonal Divider Design at Bottom - Rotated 180 degrees */}
      <div 
        className="w-full bg-[#0F766E] absolute bottom-0"
        style={{
          height: '350px',
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 20%, 60% 20%, 40% 150%, 0% 100%)',
          transform: 'rotate(180deg)'
        }}
      >
      </div>
    </section>
  );
}
