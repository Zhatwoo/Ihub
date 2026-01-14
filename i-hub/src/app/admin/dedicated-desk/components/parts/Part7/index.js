"use client";

import DeskWithChair from "../../DeskWithChair";
import Wall from "../../Wall";

export default function Part7({ onDeskClick, startX, startY, wallAlignX, tagPrefix = "G" }) {
  const deskWidth = 80;
  const pairHeight = 136;
  const rowGap = 26;

  const getTag = (deskNumber) => `${tagPrefix}${deskNumber}`;

  const HorizontalPair = ({ x, y, deskNumber }) => {
    const topTag = getTag(deskNumber);
    const bottomTag = getTag(deskNumber + 1);
    
    return (
      <div className="absolute" style={{ left: `${x}px`, top: `${y}px` }}>
        <div className="flex flex-col items-center">
          <DeskWithChair orientation="horizontal-top" onClick={() => onDeskClick(topTag)} />
          <div style={{ marginTop: "-4px" }}>
            <DeskWithChair orientation="horizontal-bottom" onClick={() => onDeskClick(bottomTag)} />
          </div>
        </div>
      </div>
    );
  };

  const wallX = wallAlignX;
  const wallY = 0;
  
  return (
    <>
      <div className="absolute" style={{ left: `${wallX}px`, top: `${wallY}px` }}>
        <Wall />
      </div>
      
      {Array.from({ length: 3 }).map((_, rowIdx) =>
        Array.from({ length: 5 }).map((_, pairIdx) => {
          const deskNumber = (rowIdx * 5 * 2) + (pairIdx * 2) + 1; // G1-G30
          return (
            <HorizontalPair 
              key={`part7-row${rowIdx}-pair${pairIdx}`} 
              x={startX + pairIdx * deskWidth} 
              y={startY + rowIdx * (pairHeight + rowGap)}
              deskNumber={deskNumber}
            />
          );
        })
      )}
    </>
  );
}
