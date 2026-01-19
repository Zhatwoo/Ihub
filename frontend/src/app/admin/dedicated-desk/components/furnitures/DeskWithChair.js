"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function DeskWithChair({ onClick, orientation = "horizontal-top", className = "", thinOutline = false, isOccupied = false, occupantType = "Employee", occupantName = "", zoom = 1, showPrivateInfo = true }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const deskRef = useRef(null);
  const isHorizontal = orientation.startsWith("horizontal");
  const containerWidth = isHorizontal ? "90px" : "90px";
  const containerHeight = isHorizontal ? "70px" : "90px";
  
  const deskBg = thinOutline ? "bg-gray-400 border-2 border-black" : "bg-black";
  
  // Determine overlay color based on occupant type
  const overlayColor = occupantType === "Tenant" ? "bg-blue-500" : "bg-red-500";
  
  // Calculate tooltip scale based on zoom (inverse relationship: smaller zoom = larger tooltip)
  // But limit the scaling to prevent it from getting too big in Floor Plan view
  const tooltipScale = zoom < 1 ? Math.min(1 / zoom, 2) : 1; // Max 2x scale instead of 3x
  const clampedScale = tooltipScale;
  
  // Base size adjustments: larger base for By Part view (zoom=1), smaller scaled for Floor Plan
  // Use Number(zoom) === 1 to handle potential string/number conversion issues
  const isByPartView = Number(zoom) === 1;
  const basePadding = isByPartView ? '10px 16px' : '3px 6px';
  const baseNameSize = isByPartView ? '16px' : '9px';
  const baseTypeSize = isByPartView ? '12px' : '8px';

  // Calculate tooltip position when hovering
  useEffect(() => {
    if (showTooltip && deskRef.current) {
      const updateTooltipPosition = () => {
        const rect = deskRef.current.getBoundingClientRect();
        const tooltipWidth = 50; // Approximate tooltip width (compact)
        const tooltipHeight = 24; // Approximate tooltip height (compact)
        
        setTooltipPosition({
          top: rect.top - tooltipHeight - 3, // Position above the desk
          left: rect.left + (rect.width / 2) - (tooltipWidth / 2) // Center horizontally
        });
      };
      
      updateTooltipPosition();
      window.addEventListener('scroll', updateTooltipPosition, true);
      window.addEventListener('resize', updateTooltipPosition);
      
      return () => {
        window.removeEventListener('scroll', updateTooltipPosition, true);
        window.removeEventListener('resize', updateTooltipPosition);
      };
    }
  }, [showTooltip]);

  return (
    <>
      <div
        ref={deskRef}
        onClick={onClick}
        onMouseEnter={() => isOccupied && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`relative cursor-pointer transition-transform hover:scale-105 ${className}`}
        style={{ width: containerWidth, height: containerHeight }}
      >
        {/* Color overlay for occupied desks */}
        {isOccupied && (
          <div 
            className={`absolute inset-0 ${overlayColor} rounded-sm z-10 pointer-events-none`}
            style={{ opacity: 0.35 }}
          />
        )}
        {orientation === "horizontal-top" ? (
        <>
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
            style={{ width: "20px", height: "20px", top: "0px" }}
          />
          <div
            className={`absolute left-1/2 -translate-x-1/2 rounded-sm ${deskBg}`}
            style={{ width: "80px", height: "40px", top: "26px" }}
          >
            {!thinOutline && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gray-400"
                style={{ width: "70px", height: "30px" }}
              />
            )}
          </div>
        </>
      ) : orientation === "horizontal-bottom" ? (
        <>
          <div
            className={`absolute left-1/2 -translate-x-1/2 rounded-sm ${deskBg}`}
            style={{ width: "80px", height: "40px", top: "0px" }}
          >
            {!thinOutline && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gray-400"
                style={{ width: "70px", height: "30px" }}
              />
            )}
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
            style={{ width: "20px", height: "20px", top: "46px" }}
          />
        </>
      ) : orientation === "vertical-left" ? (
        <>
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full bg-black"
            style={{ width: "20px", height: "20px", left: "0px" }}
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 rounded-sm ${deskBg}`}
            style={{ width: "40px", height: "80px", left: "26px" }}
          >
            {!thinOutline && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gray-400"
                style={{ width: "30px", height: "70px" }}
              />
            )}
          </div>
        </>
      ) : orientation === "vertical-right" ? (
        <>
          <div
            className={`absolute top-1/2 -translate-y-1/2 rounded-sm ${deskBg}`}
            style={{ width: "40px", height: "80px", left: "0px" }}
          >
            {!thinOutline && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gray-400"
                style={{ width: "30px", height: "70px" }}
              />
            )}
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full bg-black"
            style={{ width: "20px", height: "20px", left: "46px" }}
          />
        </>
      ) : null}
      </div>
      
      {/* Hover Tooltip for occupied desks - Rendered via Portal */}
      {isOccupied && showTooltip && typeof window !== 'undefined' ? createPortal(
        <div 
          className="fixed pointer-events-none z-99999"
          style={{ 
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: `scale(${clampedScale})`,
            transformOrigin: 'bottom center'
          }}
        >
          <div 
            className="bg-slate-800 text-white rounded shadow-lg text-center border border-slate-700 whitespace-nowrap"
            style={{
              padding: basePadding,
              minWidth: isByPartView ? '80px' : '30px',
              maxWidth: isByPartView ? '160px' : '60px',
              lineHeight: 1
            }}
          >
            {showPrivateInfo && occupantName ? (
              <>
                <div className="font-medium" style={{ fontSize: baseNameSize, marginBottom: 0, lineHeight: 1 }}>{occupantName}</div>
                <div className={`px-0.5 py-0 rounded-full inline-block ${
                  occupantType === "Tenant" 
                    ? "bg-blue-500/30 text-blue-200" 
                    : "bg-red-500/30 text-red-200"
                }`} style={{ fontSize: baseTypeSize, lineHeight: 1, marginTop: 0 }}>
                  {occupantType}
                </div>
              </>
            ) : (
              <div className="font-medium" style={{ fontSize: baseNameSize, lineHeight: 1 }}>Occupied</div>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-slate-800"></div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
