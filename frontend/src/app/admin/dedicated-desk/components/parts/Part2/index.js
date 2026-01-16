"use client";

import DeskWithChair from "../../furnitures/DeskWithChair";
import Wall from "../../furnitures/Wall";

export default function Part2({ onDeskClick, startY = 0, tagPrefix = "B", deskAssignments = {}, zoom = 1, isStandalone = false, showPrivateInfo = true }) {
  const deskWidth = 80;
  const deskHeight = 80;
  const verticalPairWidth = 156;
  const part1TopWallX = 5 * deskWidth;
  const wallSize = 120;

  const baseY = isStandalone ? wallSize : startY;

  const getTag = (deskNumber) => `${tagPrefix}${deskNumber}`;

  const VerticalPair = ({ x, y, deskNumber }) => {
    const leftTag = getTag(deskNumber);
    const rightTag = getTag(deskNumber + 1);
    
    return (
      <div className="absolute" style={{ left: `${x}px`, top: `${y}px` }}>
        <div className="flex flex-row items-center">
          <DeskWithChair 
            orientation="vertical-left" 
            onClick={() => onDeskClick(leftTag)}
            isOccupied={!!deskAssignments[leftTag]}
            occupantType={deskAssignments[leftTag]?.type || "Employee"}
            occupantName={deskAssignments[leftTag]?.name || ""}
            zoom={zoom}
            showPrivateInfo={showPrivateInfo}
          />
          <div style={{ marginLeft: "-24px" }}>
            <DeskWithChair 
              orientation="vertical-right" 
              onClick={() => onDeskClick(rightTag)}
              isOccupied={!!deskAssignments[rightTag]}
              occupantType={deskAssignments[rightTag]?.type || "Employee"}
              occupantName={deskAssignments[rightTag]?.name || ""}
              zoom={zoom}
              showPrivateInfo={showPrivateInfo}
            />
          </div>
        </div>
      </div>
    );
  };

  const totalWidth = 3 * verticalPairWidth;
  const wallX = isStandalone ? totalWidth : part1TopWallX;

  return (
    <>
      <div className="absolute" style={{ left: `${wallX}px`, top: `${isStandalone ? 0 : baseY}px` }}>
        <Wall />
      </div>
      
      {Array.from({ length: 3 }).map((_, colIdx) => {
        const columnX = isStandalone ? colIdx * verticalPairWidth : (part1TopWallX - totalWidth) + colIdx * verticalPairWidth;
        const verticalRowHeight = deskHeight;
        return Array.from({ length: 4 }).map((_, pairIdx) => {
          const deskNumber = (colIdx * 4 * 2) + (pairIdx * 2) + 1;
          return (
            <VerticalPair 
              key={`part2-col${colIdx}-pair${pairIdx}`} 
              x={columnX} 
              y={baseY + pairIdx * verticalRowHeight}
              deskNumber={deskNumber}
            />
          );
        });
      })}
    </>
  );
}
