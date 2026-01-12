import { League_Spartan } from 'next/font/google';
import Image from 'next/image';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default function VirtualOfficeHero() {
  return (
    <div className="w-full bg-[#FFFFFF] min-h-[1080px]">
      {/* Diagonal Divider Design at Top */}
      <div 
        className="w-full bg-[#0F766E] relative"
        style={{
          height: '500px',
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 5%, 60% 5%, 40% 150%, 0% 100%)'
        }}
      >
        {/* Green Rectangle with Text */}
        <div className="absolute left-[8%] top-[15%] sm:left-[8%] sm:top-[15%]">
          <div className=" bg-transparent p-8 sm:p-10 lg:p-12">
            <h1 className={`text-white text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-4 ${leagueSpartan.className}`}>
              Virtual Office
            </h1>
            <p className={`text-white text-2xl sm:text-3xl lg:text-4xl leading-relaxed text-center ${leagueSpartan.className}`}>
              Professional business address and <br/> support services for your growing <br/> enterprise
            </p>
          </div>
        </div>
      </div>

      {/* White Section with Green Rectangle Box and Text */}
      <div className="w-full bg-[#FFFFFF] relative min-h-[600px]">
        {/* Green Rectangle Box with Image */}
        <div className="absolute right-[25%] -top-64 sm:right-[25%] sm:-top-80 lg:right-[25%] lg:-top-96">
          <div className="bg-transparent p-8 sm:p-10 lg:p-12 w-96 h-72 sm:w-[480px] sm:h-[336px] lg:w-[576px] lg:h-96 relative">
            <Image
              src="/bg/image.png"
              alt="Virtual Office"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Second Image to the Right */}
        <div className="absolute right-[calc(5%-8%)] -top-64 sm:right-[calc(5%-8%)] sm:-top-80 lg:right-[calc(5%-8%)] lg:-top-96" style={{ transform: 'translateY(40%)' }}>
          <div className="bg-transparent p-8 sm:p-10 lg:p-12 w-96 h-72 sm:w-[480px] sm:h-[336px] lg:w-[576px] lg:h-96 relative">
            <Image
              src="/bg/image1.png"
              alt="Virtual Office"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Third Image Below Second Image */}
        <div className="absolute right-[calc(5%-8%+10%)] -top-64 sm:right-[calc(5%-8%+10%)] sm:-top-80 lg:right-[calc(5%-8%+10%)] lg:-top-96" style={{ transform: 'translateY(calc(40% + 100%))' }}>
          <div className="bg-transparent p-8 sm:p-10 lg:p-12 w-96 h-72 sm:w-[480px] sm:h-[336px] lg:w-[576px] lg:h-96 relative">
            <Image
              src="/bg/Image2.png"
              alt="Virtual Office"
              fill
              className="object-contain"
            />
          </div>
        </div>
        
        {/* Text in White Background */}
        <div className="absolute left-[10%] top-8 sm:left-[10%] sm:top-12 lg:left-[10%] lg:top-16">
          <div className="max-w-[63rem]">
            <p className={`text-gray-800 text-[1.294rem] sm:text-[1.438rem] lg:text-[1.725rem] leading-relaxed text-left font-bold ${leagueSpartan.className}`}>
              I-Hub's Virtual Office solutions equip your business with the essential tools to thrive. Establish a strong presence with a prestigious 5-star business address, a local phone number, dedicated receptionist services, and comprehensive corporate registration support.
              <br/><br/>
              With an I-Hub Virtual Office, you can project the image and enjoy the operational support of a well-established global company—quickly, seamlessly, and at a fraction of the traditional cost.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
