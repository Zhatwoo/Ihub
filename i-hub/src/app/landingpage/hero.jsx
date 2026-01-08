export default function Hero() {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Organic Green Blob Background */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-full">
        <svg
          className="absolute bottom-0 left-0 w-full h-full"
          viewBox="0 0 1440 800"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,600 L600,600 C600,700 600,650 100,600 C200,600 400,500 600,400 C800,300 1000,138 1200,138 C1300,138 1380,140 1440,150 L1440,800 L0,800 Z"
            fill="#0F766E"
          />
        </svg>
      </div>
    </div>
  );
}

