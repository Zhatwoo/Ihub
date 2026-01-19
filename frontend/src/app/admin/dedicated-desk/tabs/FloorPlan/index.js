"use client";

import Part1 from "../../components/parts/Part1";
import Part2 from "../../components/parts/Part2";
import Part3 from "../../components/parts/Part3";
import Part4 from "../../components/parts/Part4";
import Part5 from "../../components/parts/Part5";
import Part6 from "../../components/parts/Part6";
import Part7 from "../../components/parts/Part7";
import Part8 from "../../components/parts/Part8";

export default function FloorPlanView({ 
  zoom, 
  handleZoomIn, 
  handleZoomOut, 
  handleResetZoom, 
  handleDeskClick, 
  deskAssignments, 
  isLoaded 
}) {
  // Dimensions for positioning
  const deskWidth = 80;
  const horizontalContainerHeight = 70;
  const pairHeight = 136;
  const rowGap = 20;
  const wallSize = 120;
  const deskHeight = 80;
  
  const topRowStartY = 40;
  const part1Height = topRowStartY + horizontalContainerHeight + rowGap + 3 * (pairHeight + rowGap);
  const part1TopWallX = 5 * deskWidth;
  const part3StartX = part1TopWallX + wallSize + 80;
  const verticalContainerWidth = 90;
  const verticalPairWidth = 156;
  
  const part3Col4X = part3StartX + verticalContainerWidth + 2 * verticalPairWidth;
  const part3WallX = part3Col4X + 26 + 40 - 60;
  
  const part2StartY = part1Height + 100;
  
  const part4StartX = part3StartX - 40;
  const part4StartY = part2StartY + wallSize + 20;
  
  const part5StartX = part3Col4X + verticalPairWidth + 60;
  const part5StartY = 136;
  
  const part5WallX = part5StartX + 5 * deskWidth + 40;
  
  const part6WallX = part5WallX;
  const part6WallY = part2StartY;
  
  const part7StartX = part5WallX + wallSize + 2 * verticalPairWidth - 100;
  const part7StartY = 136;
  
  const part7WallX = part7StartX + 5 * deskWidth - 30 - 50;
  
  const part8WallX = part7WallX;
  const part8WallY = part2StartY;
  const part8StartX = part7StartX + deskWidth;
  const part8StartY = part8WallY + wallSize - 5 + 20;

  return (
    <div className="relative">
      {/* Zoom Controls */}
      <div className={`absolute top-0 right-0 z-20 flex flex-row gap-1 bg-white rounded-lg shadow-lg p-1 transition-all duration-500 delay-200 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
        <button 
          onClick={handleZoomIn}
          className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-base font-bold"
        >
          +
        </button>
        <button 
          onClick={handleResetZoom}
          className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-[10px] font-bold"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button 
          onClick={handleZoomOut}
          className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-base font-bold"
        >
          −
        </button>
      </div>
      
      <div
        className={`bg-gray-100 rounded-xl border border-gray-200 transition-all duration-500 delay-100 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{
          backgroundImage: "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          width: "100%",
          height: "calc(100vh - 240px)",
          maxHeight: "calc(100vh - 240px)",
          overflow: "auto",
          paddingBottom: "20px",
        }}
      >
        <div 
          className="relative" 
          style={{ 
            width: "800px", 
            height: "400px", 
            marginLeft: "20px",
            marginTop: "20px",
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <div style={{ position: 'absolute', left: '380px', top: '40px' }}>
            <Part1 onDeskClick={handleDeskClick} tagPrefix="A" deskAssignments={deskAssignments} zoom={zoom} />
            <Part2 onDeskClick={handleDeskClick} startY={part2StartY} tagPrefix="B" deskAssignments={deskAssignments} zoom={zoom} />
            <Part3 onDeskClick={handleDeskClick} startX={part3StartX} tagPrefix="C" deskAssignments={deskAssignments} zoom={zoom} />
            <Part4 onDeskClick={handleDeskClick} startX={part4StartX} startY={part4StartY} wallAlignX={part3WallX} wallAlignY={part2StartY} tagPrefix="D" deskAssignments={deskAssignments} zoom={zoom} />
          </div>
          <div style={{ position: 'absolute', left: '470px', top: '40px' }}>
            <Part5 onDeskClick={handleDeskClick} startX={part5StartX} startY={part5StartY} wallAlignX={part5WallX} tagPrefix="E" deskAssignments={deskAssignments} zoom={zoom} />
            <Part6 onDeskClick={handleDeskClick} wallAlignX={part6WallX} wallAlignY={part6WallY} tagPrefix="F" deskAssignments={deskAssignments} zoom={zoom} />
            <Part7 onDeskClick={handleDeskClick} startX={part7StartX} startY={part7StartY} wallAlignX={part7WallX} tagPrefix="G" deskAssignments={deskAssignments} zoom={zoom} />
            <Part8 onDeskClick={handleDeskClick} startX={part8StartX} startY={part8StartY} wallAlignX={part8WallX} wallAlignY={part8WallY} tagPrefix="H" deskAssignments={deskAssignments} zoom={zoom} />
          </div>
        </div>
      </div>
    </div>
  );
}
