"use client";

import DeskWithChair from "../../DeskWithChair";
import Wall from "../../Wall";

export default function Part1({ onDeskClick, tagPrefix = "A", deskAssignments = {}, zoom = 1, isStandalone = false, showPrivateInfo = true }) {
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
          <DeskWithChair 
            orientation="horizontal-top" 
            onClick={() => onDeskClick(topTag)}
            isOccupied={!!deskAssignments[topTag]}
            occupantType={deskAssignments[topTag]?.type || "Employee"}
            occupantName={deskAssignments[topTag]?.name || ""}
            zoom={zoom}
            showPrivateInfo={showPrivateInfo}
          />
          <div style={{ marginTop: "-4px" }}>
            <DeskWithChair 
              orientation="horizontal-bottom" 
              onClick={() => onDeskClick(bottomTag)}
              isOccupied={!!deskAssignments[bottomTag]}
              occupantType={deskAssignments[bottomTag]?.type || "Employee"}
              occupantName={deskAssignments[bottomTag]?.name || ""}
              zoom={zoom}
              showPrivateInfo={showPrivateInfo}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {Array.from({ length: 5 }).map((_, pairIdx) => {
        const deskNumber = pairIdx + 1;
        const tag = getTag(deskNumber);
        return (
          <div key={`top-${pairIdx}`} className="absolute" style={{ 
            left: `${pairIdx * deskWidth}px`, 
            top: `${topRowY}px` 
          }}>
            <DeskWithChair 
              orientation="horizontal-bottom" 
              onClick={() => onDeskClick(tag)}
              isOccupied={!!deskAssignments[tag]}
              occupantType={deskAssignments[tag]?.type || "Employee"}
              occupantName={deskAssignments[tag]?.name || ""}
              zoom={zoom}
              showPrivateInfo={showPrivateInfo}
            />
          </div>
        );
      })}
      
      <div className="absolute" style={{ left: `${part1TopWallX}px`, top: "0px" }}>
        <Wall />
      </div>
      
      {Array.from({ length: 3 }).map((_, rowIdx) =>
        Array.from({ length: 6 }).map((_, pairIdx) => {
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
