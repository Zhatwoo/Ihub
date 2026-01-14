"use client";

import DeskWithChair from "../../DeskWithChair";
import Wall from "../../Wall";

export default function Part8({ onDeskClick, startX, startY, wallAlignX, wallAlignY, tagPrefix = "H" }) {
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
  const wallY = wallAlignY;
  
  return (
    <>
      <div className="absolute" style={{ left: `${wallX}px`, top: `${wallY}px` }}>
        <Wall />
      </div>
      
      {Array.from({ length: 3 }).map((_, rowIdx) =>
        Array.from({ length: 4 }).map((_, pairIdx) => {
          const deskNumber = (rowIdx * 4 * 2) + (pairIdx * 2) + 1; // H1-H24
          return (
            <HorizontalPair 
              key={`part8-row${rowIdx}-pair${pairIdx}`} 
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
