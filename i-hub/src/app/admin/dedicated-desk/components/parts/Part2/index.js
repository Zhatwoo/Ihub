"use client";

import DeskWithChair from "../../DeskWithChair";
import Wall from "../../Wall";

export default function Part2({ onDeskClick, startY, tagPrefix = "B" }) {
  const deskWidth = 80;
  const deskHeight = 80;
  const verticalPairWidth = 156;
  const part1TopWallX = 5 * deskWidth;

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
      <div className="absolute" style={{ left: `${part1TopWallX}px`, top: `${startY}px` }}>
        <Wall />
      </div>
      
      {Array.from({ length: 3 }).map((_, colIdx) => {
        const totalWidth = 3 * verticalPairWidth;
        const startX = part1TopWallX - totalWidth;
        const columnX = startX + colIdx * verticalPairWidth;
        const verticalRowHeight = deskHeight;
        return Array.from({ length: 4 }).map((_, pairIdx) => {
          // Calculate desk number: colIdx * 4 pairs * 2 desks + pairIdx * 2 desks + 1
          const deskNumber = (colIdx * 4 * 2) + (pairIdx * 2) + 1;
          return (
            <VerticalPair 
              key={`part2-col${colIdx}-pair${pairIdx}`} 
              x={columnX} 
              y={startY + pairIdx * verticalRowHeight}
              deskNumber={deskNumber}
            />
          );
        });
      })}
    </>
  );
}
