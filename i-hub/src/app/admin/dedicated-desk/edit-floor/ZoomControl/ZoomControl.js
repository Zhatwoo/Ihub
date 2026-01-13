'use client';

export default function ZoomControl({ zoom, setZoom, onReset }) {
  const minZoom = 0.1;
  const maxZoom = 5;
  
  const handleZoomChange = (e) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
  };
  
  const handleZoomIn = () => {
    const newZoom = Math.min(maxZoom, zoom + 0.1);
    setZoom(newZoom);
  };
  
  const handleZoomOut = () => {
    const newZoom = Math.max(minZoom, zoom - 0.1);
    setZoom(newZoom);
  };
  
  return (
    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
      {/* Zoom Percentage */}
      <span className="text-sm font-medium text-gray-700 min-w-[45px]">
        {Math.round(zoom * 100)}%
      </span>
      
      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        className="w-6 h-6 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
        title="Zoom Out"
      >
        <span className="text-sm">−</span>
      </button>
      
      {/* Zoom Slider */}
      <input
        type="range"
        min={minZoom}
        max={maxZoom}
        step={0.01}
        value={zoom}
        onChange={handleZoomChange}
        className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%, #e5e7eb ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%, #e5e7eb 100%)`
        }}
      />
      
      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        className="w-6 h-6 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
        title="Zoom In"
      >
        <span className="text-sm">+</span>
      </button>
    </div>
  );
}

