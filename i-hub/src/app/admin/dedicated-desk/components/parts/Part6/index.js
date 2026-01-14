"use client";

import Wall from "../../Wall";
import DeskWithChair from "../../DeskWithChair";

export default function Part6({ onDeskClick, wallAlignX, wallAlignY, tagPrefix = "F" }) {
  const wallSize = 120;
  const deskHeight = 80;
  const verticalPairWidth = 156;
  
  const wallX = wallAlignX;
  const wallY = wallAlignY;
  const desksStartY = wallY + wallSize - 5;
  const desksStartX = wallX + 20 - 26;
  const col2StartX = desksStartX + verticalPairWidth;
  const col2StartY = desksStartY - deskHeight;
  const col3StartX = desksStartX - verticalPairWidth;
  const col3StartY = col2StartY;

  const getTag = (deskNumber) => `${tagPrefix}${deskNumber}`;
  
  const VerticalPair = ({ x, y, deskNumber }) => {
    const leftTag = getTag(deskNumber);
    const rightTag = getTag(deskNumber + 1);
    
    return (
      <div className="absolute" style={{ left: `${x}px`, top: `${y}px` }}>
        <div className="flex flex-row items-center">
          <DeskWithChair orientation="vertical-left" onClick={() => onDeskClick(leftTag)} />
          <div style={{ marginLeft: "-24px" }}>
            <DeskWithChair orientation="vertical-right" onClick={() => onDeskClick(rightTag)} />
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <>
      <div className="absolute" style={{ left: `${wallX}px`, top: `${wallY}px` }}>
        <Wall />
      </div>
      
      {Array.from({ length: 4 }).map((_, idx) => {
        const deskNumber = 1 + idx; // F1-F4
        const tag = getTag(deskNumber);
        return (
          <div 
            key={`part6-col3-desk-${idx}`} 
            className="absolute" 
            style={{ 
              left: `${col3StartX + 66}px`, 
              top: `${col3StartY + idx * deskHeight}px` 
            }}
          >
            <DeskWithChair orientation="vertical-right" onClick={() => onDeskClick(tag)} />
          </div>
        );
      })}
      
      <div 
        className="absolute" 
        style={{ 
          left: `${col3StartX + 66 - 85}px`, 
          top: `${col3StartY + 5}px` 
        }}
      >
        <DeskWithChair orientation="horizontal-top" onClick={() => onDeskClick(getTag(5))} thinOutline={true} />
      </div>
      
      {Array.from({ length: 3 }).map((_, idx) => {
        const deskNumber = 6 + (idx * 2); // F6-F11
        return (
          <VerticalPair 
            key={`part6-col1-pair-${idx}`} 
            x={desksStartX} 
            y={desksStartY + idx * deskHeight}
            deskNumber={deskNumber}
          />
        );
      })}
      
      {Array.from({ length: 4 }).map((_, idx) => {
        const deskNumber = 12 + (idx * 2); // F12-F19
        return (
          <VerticalPair 
            key={`part6-col2-pair-${idx}`} 
            x={col2StartX} 
            y={col2StartY + idx * deskHeight}
            deskNumber={deskNumber}
          />
        );
      })}
      
      <div 
        className="absolute" 
        style={{ 
          left: `${col3StartX + 66 - 85}px`, 
          top: `${col3StartY + 2 * deskHeight + 5}px` 
        }}
      >
        <DeskWithChair orientation="horizontal-top" onClick={() => onDeskClick(getTag(20))} thinOutline={true} />
      </div>
      
      <div 
        className="absolute" 
        style={{ 
          left: `${col3StartX + 66 - 85 - 80}px`, 
          top: `${col3StartY + 2 * deskHeight + 5}px` 
        }}
      >
        <DeskWithChair orientation="horizontal-top" onClick={() => onDeskClick(getTag(21))} thinOutline={true} />
      </div>
      
      {Array.from({ length: 2 }).map((_, idx) => {
        const deskNumber = 22 + (idx * 2); // F22-F25
        return (
          <VerticalPair 
            key={`part6-col4-pair-${idx}`} 
            x={col3StartX + 66 - 85 - 80 - 90} 
            y={col2StartY + idx * deskHeight}
            deskNumber={deskNumber}
          />
        );
      })}
      
      <div 
        className="absolute" 
        style={{ 
          left: `${col3StartX + 66 - 85 - 80 - 90}px`, 
          top: `${col2StartY + 2 * deskHeight}px` 
        }}
      >
        <DeskWithChair orientation="vertical-left" onClick={() => onDeskClick(getTag(26))} />
      </div>
      
      <div 
        className="absolute cursor-pointer transition-transform hover:scale-105" 
        style={{ 
          left: `${col3StartX + 66 - 85 - 80 - 90 + 66}px`, 
          top: `${col2StartY + 2 * deskHeight + 5}px` 
        }}
        onClick={() => onDeskClick(getTag(27))}
      >
        <div className="bg-black rounded-sm" style={{ width: "40px", height: "80px" }}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gray-400" style={{ width: "30px", height: "70px" }} />
        </div>
      </div>
      
      {Array.from({ length: 3 }).map((_, idx) => {
        const deskNumber = 28 + (idx * 2); // F28-F33
        return (
          <VerticalPair 
            key={`part6-col5-pair-${idx}`} 
            x={col3StartX + 66 - 85 - 80 - 90 - verticalPairWidth} 
            y={col2StartY + idx * deskHeight}
            deskNumber={deskNumber}
          />
        );
      })}
    </>
  );
}
