"use client";

import DeskWithChair from "../../DeskWithChair";
import Wall from "../../Wall";

export default function Part1({ onDeskClick, tagPrefix = "A" }) {
  const deskWidth = 80;
  const horizontalContainerHeight = 70;
  const pairHeight = 136;
  const part1TopWallX = 5 * deskWidth;
  const wallSize = 120;
  const deskHeight = 80;
  
  const part3Bottom = wallSize - 5 + 6 * deskHeight;
  const topRowY = 40;
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

  return (
    <>
      {Array.from({ length: 5 }).map((_, pairIdx) => {
        const deskNumber = pairIdx + 1; // A1-A5
        const tag = getTag(deskNumber);
        return (
          <div key={`top-${pairIdx}`} className="absolute" style={{ 
            left: `${pairIdx * deskWidth}px`, 
            top: `${topRowY}px` 
          }}>
            <DeskWithChair orientation="horizontal-bottom" onClick={() => onDeskClick(tag)} />
          </div>
        );
      })}
      
      <div className="absolute" style={{ left: `${part1TopWallX}px`, top: "0px" }}>
        <Wall />
      </div>
      
      {Array.from({ length: 3 }).map((_, rowIdx) =>
        Array.from({ length: 6 }).map((_, pairIdx) => {
          // Start from A6 (after 5 single desks)
          const baseDeskNumber = 5 + (rowIdx * 6 * 2) + (pairIdx * 2) + 1;
          return (
            <HorizontalPair 
              key={`row${rowIdx}-pair${pairIdx}`} 
              x={pairIdx * deskWidth} 
              y={topRowY + horizontalContainerHeight + rowGap + rowIdx * (pairHeight + rowGap)}
              deskNumber={baseDeskNumber}
            />
          );
        })
      )}
    </>
  );
}
