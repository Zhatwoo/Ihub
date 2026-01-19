"use client";

import DeskWithChair from "../../furnitures/DeskWithChair";
import Wall from "../../furnitures/Wall";

export default function Part7({ onDeskClick, startX = 0, startY = 0, wallAlignX = 400, tagPrefix = "G", deskAssignments = {}, zoom = 1, isStandalone = false, showPrivateInfo = true }) {
  const deskWidth = 80;
  const pairHeight = 136;
  const rowGap = 26;

  // When standalone, use local positioning
  const baseX = isStandalone ? 0 : startX;
  const baseY = isStandalone ? 136 : startY;
  const wallX = isStandalone ? 5 * deskWidth - 30 - 50 : wallAlignX;

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

  const wallY = 0;
  
  return (
    <>
      <div className="absolute" style={{ left: `${wallX}px`, top: `${wallY}px` }}>
        <Wall />
      </div>
      
      {Array.from({ length: 3 }).map((_, rowIdx) =>
        Array.from({ length: 5 }).map((_, pairIdx) => {
          const deskNumber = (rowIdx * 5 * 2) + (pairIdx * 2) + 1;
          return (
            <HorizontalPair 
              key={`part7-row${rowIdx}-pair${pairIdx}`} 
              x={baseX + pairIdx * deskWidth} 
              y={baseY + rowIdx * (pairHeight + rowGap)}
              deskNumber={deskNumber}
            />
          );
        })
      )}
    </>
  );
}
