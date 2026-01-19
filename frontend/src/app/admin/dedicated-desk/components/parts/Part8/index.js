"use client";

import DeskWithChair from "../../furnitures/DeskWithChair";
import Wall from "../../furnitures/Wall";

export default function Part8({ onDeskClick, startX = 0, startY = 0, wallAlignX = 320, wallAlignY = 0, tagPrefix = "H", deskAssignments = {}, zoom = 1, isStandalone = false, showPrivateInfo = true }) {
  const deskWidth = 80;
  const pairHeight = 136;
  const rowGap = 26;
  const wallSize = 120;

  // When standalone, use local positioning
  const baseX = isStandalone ? 0 : startX;
  const baseY = isStandalone ? wallSize + 20 : startY;
  const wallX = isStandalone ? 4 * deskWidth - 30 : wallAlignX;
  const wallY = isStandalone ? 0 : wallAlignY;

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
      <div className="absolute" style={{ left: `${wallX}px`, top: `${wallY}px` }}>
        <Wall />
      </div>
      
      {Array.from({ length: 3 }).map((_, rowIdx) =>
        Array.from({ length: 4 }).map((_, pairIdx) => {
          const deskNumber = (rowIdx * 4 * 2) + (pairIdx * 2) + 1;
          return (
            <HorizontalPair 
              key={`part8-row${rowIdx}-pair${pairIdx}`} 
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
