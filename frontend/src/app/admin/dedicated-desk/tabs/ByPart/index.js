"use client";

import { useState, useEffect } from "react";
import { api } from '@/lib/api';
import Part1 from "../../components/parts/Part1/index.js";
import Part2 from "../../components/parts/Part2/index.js";
import Part3 from "../../components/parts/Part3/index.js";
import Part4 from "../../components/parts/Part4/index.js";
import Part5 from "../../components/parts/Part5/index.js";
import Part6 from "../../components/parts/Part6/index.js";
import Part7 from "../../components/parts/Part7/index.js";
import Part8 from "../../components/parts/Part8/index.js";

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

  // Get occupants for the selected part
  // Get occupants for selected part from backend
  const [partOccupants, setPartOccupants] = useState([]);

  useEffect(() => {
    const fetchPartOccupants = async () => {
      if (!selectedPartData) {
        setPartOccupants([]);
        return;
      }
      
      try {
        const response = await api.get(`/api/admin/dedicated-desk/occupants/${selectedPartData.tagPrefix}`);
        if (response.success && response.data) {
          setPartOccupants(response.data.occupants || []);
        }
      } catch (error) {
        console.error('Error fetching part occupants:', error);
        setPartOccupants([]);
      }
    };

    fetchPartOccupants();
  }, [selectedPartData]);

  const currentPartOccupants = partOccupants;

  return (
    <div className="flex gap-4 h-full">
      {/* Left Side - Part View */}
      <div className="flex-1 bg-gray-100 rounded-xl border border-gray-200 relative" style={{
        backgroundImage: "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        height: "calc(100vh - 280px)",
        maxHeight: "calc(100vh - 280px)",
        minHeight: "500px",
        overflow: "auto",
        paddingBottom: "20px",
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

        {/* Selected Part Display */}
        {selectedPartData && PartComponent ? (
          <div className="flex items-center justify-center w-full p-4" style={{ minHeight: "400px" }}>
            <div 
              className="relative" 
              style={{ 
                width: "500px", 
                height: "400px",
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
                wallAlignX={300}
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

      {/* Right Side - Occupants List */}
      <div className="w-80 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Occupants
            {selectedPartData && (
              <span className="text-sm font-normal text-gray-500">
                - Part {selectedPartData.number} ({selectedPartData.tagPrefix})
              </span>
            )}
          </h3>
          {selectedPartData && (
            <p className="text-sm text-gray-600 mt-1">
              {currentPartOccupants.length} occupied desk{currentPartOccupants.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="overflow-y-auto" style={{ height: "calc(100vh - 380px)" }}>
          {!selectedPartData ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No part selected</p>
              <p className="text-gray-400 text-sm mt-1">Select a part to view occupants</p>
            </div>
          ) : currentPartOccupants.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No occupants</p>
              <p className="text-gray-400 text-sm mt-1">All desks in Part {selectedPartData.number} are available</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {currentPartOccupants.map((occupant) => (
                <div 
                  key={occupant.deskTag}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer"
                  onClick={() => handleDeskClick(occupant.deskTag)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-slate-800 text-white text-xs font-bold rounded">
                          {occupant.deskTag}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          occupant.type === 'Tenant' 
                            ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {occupant.type}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-slate-800 text-sm mb-1">
                        {occupant.name || 'Unknown'}
                      </h4>
                      
                      {occupant.email && (
                        <p className="text-xs text-gray-600 mb-1">
                          📧 {occupant.email}
                        </p>
                      )}
                      
                      {occupant.contactNumber && (
                        <p className="text-xs text-gray-600 mb-1">
                          📞 {occupant.contactNumber}
                        </p>
                      )}
                      
                      {occupant.company && (
                        <p className="text-xs text-gray-600 mb-1">
                          🏢 {occupant.company}
                        </p>
                      )}
                      
                      {occupant.assignedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Assigned: {new Date(occupant.assignedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    
                    <button 
                      className="text-gray-400 hover:text-teal-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeskClick(occupant.deskTag);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
