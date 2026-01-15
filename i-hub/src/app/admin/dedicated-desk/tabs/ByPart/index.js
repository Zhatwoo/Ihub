"use client";

import { useState } from "react";
import Part1 from "../../components/parts/Part1";
import Part2 from "../../components/parts/Part2";
import Part3 from "../../components/parts/Part3";
import Part4 from "../../components/parts/Part4";
import Part5 from "../../components/parts/Part5";
import Part6 from "../../components/parts/Part6";
import Part7 from "../../components/parts/Part7";
import Part8 from "../../components/parts/Part8";

export default function ByPartView({ 
  selectedPart, 
  setSelectedPart, 
  partZoom, 
  handlePartZoomIn, 
  handlePartZoomOut, 
  handlePartResetZoom, 
  handleDeskClick, 
  deskAssignments 
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const parts = [
    { number: 1, component: Part1, tagPrefix: "A" },
    { number: 2, component: Part2, tagPrefix: "B" },
    { number: 3, component: Part3, tagPrefix: "C" },
    { number: 4, component: Part4, tagPrefix: "D" },
    { number: 5, component: Part5, tagPrefix: "E" },
    { number: 6, component: Part6, tagPrefix: "F" },
    { number: 7, component: Part7, tagPrefix: "G" },
    { number: 8, component: Part8, tagPrefix: "H" },
  ];

  const selectedPartData = selectedPart ? parts.find(p => p.number === selectedPart) : null;
  const PartComponent = selectedPartData?.component;

  return (
    <div className="bg-gray-100 rounded-xl border border-gray-200 relative" style={{
      backgroundImage: "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
      backgroundSize: "20px 20px",
      width: "100%",
      height: "calc(100vh - 280px)",
      minHeight: "500px",
      overflow: "auto",
    }}>
      {/* Header with Dropdown and Zoom Controls */}
      <div className="sticky top-0 left-0 z-30 p-4 bg-linear-to-b from-gray-100 via-gray-100 to-transparent">
        <div className="flex items-start justify-between">
          {/* Part Selector Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-800 font-semibold text-sm">Select Part to View</label>
            <div className="relative w-48">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-slate-800 hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
              >
                <span className="flex items-center gap-2">
                  {selectedPartData ? (
                    <>
                      <span className="w-6 h-6 flex items-center justify-center bg-teal-600 text-white text-xs font-bold rounded-md">
                        {selectedPartData.tagPrefix}
                      </span>
                      <span>Part {selectedPartData.number}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Choose a part...</span>
                  )}
                </span>
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {parts.map((part) => (
                      <button
                        key={part.number}
                        onClick={() => {
                          setSelectedPart(part.number);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-all ${
                          selectedPart === part.number
                            ? 'bg-teal-50 text-teal-700'
                            : 'text-slate-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-md ${
                          selectedPart === part.number
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-100 text-slate-600'
                        }`}>
                          {part.tagPrefix}
                        </span>
                        <span>Part {part.number}</span>
                        {selectedPart === part.number && (
                          <svg className="w-4 h-4 ml-auto text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex flex-row gap-1 bg-white rounded-lg shadow-lg p-1">
            <button 
              onClick={handlePartZoomIn}
              className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-base font-bold"
            >
              +
            </button>
            <button 
              onClick={handlePartResetZoom}
              className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-[10px] font-bold"
            >
              {Math.round(partZoom * 100)}%
            </button>
            <button 
              onClick={handlePartZoomOut}
              className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-base font-bold"
            >
              −
            </button>
          </div>
        </div>
      </div>

      {/* Selected Part Display - Centered */}
      {selectedPartData && PartComponent ? (
        <div className="flex items-center justify-center w-full p-8" style={{ minHeight: "400px" }}>
          <div 
            className="relative" 
            style={{ 
              width: "700px", 
              height: "600px",
              transform: `scale(${partZoom})`,
              transformOrigin: "top left",
            }}
          >
            <PartComponent
              onDeskClick={handleDeskClick}
              tagPrefix={selectedPartData.tagPrefix}
              deskAssignments={deskAssignments}
              zoom={partZoom}
              startX={0}
              startY={0}
              wallAlignX={400}
              wallAlignY={0}
              isStandalone={true}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-16">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-medium">Select a part to view</p>
          <p className="text-gray-400 text-sm mt-1">Choose from the dropdown above</p>
        </div>
      )}
    </div>
  );
}
