"use client";

import DeskWithChair from "../../DeskWithChair";
import Wall from "../../Wall";
import Cabinet from "../../Cabinet";

export default function Part5({ onDeskClick, startX, startY, wallAlignX, tagPrefix = "E", deskAssignments = {}, zoom = 1, isStandalone = false }) {
  const deskWidth = 80;
  const pairHeight = 136;
  const verticalPairWidth = 156;
  const deskHeight = 80;
  const wallSize = 120;
  const rowGap = 26;

  // When standalone, use local positioning; otherwise use passed props
  const baseX = isStandalone ? 0 : startX;
  const baseY = isStandalone ? 40 : startY;
  const wallX = isStandalone ? 5 * deskWidth : wallAlignX;

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
          />
          <div style={{ marginTop: "-4px" }}>
            <DeskWithChair 
              orientation="horizontal-bottom" 
              onClick={() => onDeskClick(bottomTag)}
              isOccupied={!!deskAssignments[bottomTag]}
              occupantType={deskAssignments[bottomTag]?.type || "Employee"}
              occupantName={deskAssignments[bottomTag]?.name || ""}
              zoom={zoom}
            />
          </div>
        </div>
      </div>
    );
  };

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
          />
          <div style={{ marginLeft: "-24px" }}>
            <DeskWithChair 
              orientation="vertical-right" 
              onClick={() => onDeskClick(rightTag)}
              isOccupied={!!deskAssignments[rightTag]}
              occupantType={deskAssignments[rightTag]?.type || "Employee"}
              occupantName={deskAssignments[rightTag]?.name || ""}
              zoom={zoom}
            />
          </div>
        </div>
      </div>
    );
  };

  const wallY = 0;
  const verticalStartY = wallSize - 5;
  const verticalStartX = wallX;
  
  return (
    <>
      {Array.from({ length: 2 }).map((_, rowIdx) =>
        Array.from({ length: 5 }).map((_, pairIdx) => {
          const deskNumber = (rowIdx * 5 * 2) + (pairIdx * 2) + 1;
          return (
            <HorizontalPair 
              key={`part5-row${rowIdx}-pair${pairIdx}`} 
              x={baseX + pairIdx * deskWidth} 
              y={baseY + rowIdx * (pairHeight + rowGap)}
              deskNumber={deskNumber}
            />
          );
        })
      )}
      
      {Array.from({ length: 5 }).map((_, pairIdx) => {
        const deskNumber = 21 + pairIdx;
        const tag = getTag(deskNumber);
        return (
          <div key={`part5-row2-${pairIdx}`} className="absolute" style={{ 
            left: `${baseX + pairIdx * deskWidth}px`, 
            top: `${baseY + 2 * (pairHeight + rowGap)}px` 
          }}>
            <DeskWithChair 
              orientation="horizontal-top" 
              onClick={() => onDeskClick(tag)}
              isOccupied={!!deskAssignments[tag]}
              occupantType={deskAssignments[tag]?.type || "Employee"}
              occupantName={deskAssignments[tag]?.name || ""}
              zoom={zoom}
            />
          </div>
        );
      })}
      
      <div className="absolute" style={{ 
        left: `${baseX + 85 - 78 + 40}px`, 
        top: `${baseY + 2 * (pairHeight + rowGap) + 61}px` 
      }}>
        <div className="flex flex-row items-center">
          <DeskWithChair 
            orientation="vertical-left" 
            onClick={() => onDeskClick(getTag(26))} 
            thinOutline={true}
            isOccupied={!!deskAssignments[getTag(26)]}
            occupantType={deskAssignments[getTag(26)]?.type || "Employee"}
            occupantName={deskAssignments[getTag(26)]?.name || ""}
            zoom={zoom}
          />
          <div style={{ marginLeft: "-24px" }}>
            <DeskWithChair 
              orientation="vertical-right" 
              onClick={() => onDeskClick(getTag(27))} 
              thinOutline={true}
              isOccupied={!!deskAssignments[getTag(27)]}
              occupantType={deskAssignments[getTag(27)]?.type || "Employee"}
              occupantName={deskAssignments[getTag(27)]?.name || ""}
              zoom={zoom}
            />
          </div>
        </div>
      </div>
      
      <div className="absolute" style={{ 
        left: `${baseX + 85 - 78 + 156 + 40}px`, 
        top: `${baseY + 2 * (pairHeight + rowGap) + 61 + 5}px` 
      }}>
        <Cabinet width={60} height={30} />
      </div>
      <div className="absolute" style={{ 
        left: `${baseX + 85 - 78 + 156 + 60 + 40}px`, 
        top: `${baseY + 2 * (pairHeight + rowGap) + 61 + 5}px` 
      }}>
        <Cabinet width={60} height={30} />
      </div>
      
      <div className="absolute" style={{ left: `${wallX}px`, top: `${wallY}px` }}>
        <Wall />
      </div>
      
      {Array.from({ length: 2 }).map((_, colIdx) =>
        Array.from({ length: 6 }).map((_, pairIdx) => {
          const deskNumber = 28 + (colIdx * 6 * 2) + (pairIdx * 2);
          return (
            <VerticalPair 
              key={`part5-col${colIdx}-pair${pairIdx}`} 
              x={verticalStartX + colIdx * verticalPairWidth} 
              y={verticalStartY + pairIdx * deskHeight}
              deskNumber={deskNumber}
            />
          );
        })
      )}
    </>
  );
}
