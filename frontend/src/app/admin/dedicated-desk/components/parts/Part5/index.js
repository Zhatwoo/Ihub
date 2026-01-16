"use client";

import DeskWithChair from "../../furnitures/DeskWithChair";
import Wall from "../../furnitures/Wall";
import Cabinet from "../../furnitures/Cabinet";

export default function Part5({ onDeskClick, startX, startY, wallAlignX, tagPrefix = "E", deskAssignments = {}, zoom = 1, isStandalone = false, showPrivateInfo = true }) {
  const deskWidth = 80;
  const pairHeight = 136;
  const verticalPairWidth = 156;
  const deskHeight = 80;
  const wallSize = 120;
  const rowGap = 26;

  // When standalone, use local positioning; otherwise use passed props
  // In floor plan mode, shift 20px to the left
  const baseX = isStandalone ? 0 : startX - 20;
  const baseY = isStandalone ? 0 : startY;
  const wallX = isStandalone ? 5 * deskWidth + 40 : wallAlignX;

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

  const wallY = 0;
  const verticalStartY = wallSize - 5;
  const verticalStartX = wallX;
  
  // Calculate row positions with proper spacing
  const row0Y = baseY + 40;
  const row1Y = row0Y + pairHeight + rowGap;
  const row2Y = row1Y + pairHeight + rowGap;
  
  return (
    <>
      {/* Row 0: 5 horizontal pairs */}
      {Array.from({ length: 5 }).map((_, pairIdx) => {
        const deskNumber = (pairIdx * 2) + 1;
        return (
          <HorizontalPair 
            key={`part5-row0-pair${pairIdx}`} 
            x={baseX + pairIdx * deskWidth} 
            y={row0Y}
            deskNumber={deskNumber}
          />
        );
      })}
      
      {/* Row 1: 5 horizontal pairs */}
      {Array.from({ length: 5 }).map((_, pairIdx) => {
        const deskNumber = 11 + (pairIdx * 2);
        return (
          <HorizontalPair 
            key={`part5-row1-pair${pairIdx}`} 
            x={baseX + pairIdx * deskWidth} 
            y={row1Y}
            deskNumber={deskNumber}
          />
        );
      })}
      
      {/* Row 2: 5 single desks (chairs on top) */}
      {Array.from({ length: 5 }).map((_, pairIdx) => {
        const deskNumber = 21 + pairIdx;
        const tag = getTag(deskNumber);
        return (
          <div key={`part5-row2-${pairIdx}`} className="absolute" style={{ 
            left: `${baseX + pairIdx * deskWidth}px`, 
            top: `${row2Y}px` 
          }}>
            <DeskWithChair 
              orientation="horizontal-top" 
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
      
      {/* Vertical pair below row 2 */}
      <div className="absolute" style={{ 
        left: `${baseX + 47}px`, 
        top: `${row2Y + 65}px` 
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
            showPrivateInfo={showPrivateInfo}
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
              showPrivateInfo={showPrivateInfo}
            />
          </div>
        </div>
      </div>
      
      {/* Cabinets */}
      <div className="absolute" style={{ 
        left: `${baseX + 183}px`, 
        top: `${row2Y + 71}px` 
      }}>
        <Cabinet width={60} height={30} />
      </div>
      <div className="absolute" style={{ 
        left: `${baseX + 243}px`, 
        top: `${row2Y + 71}px` 
      }}>
        <Cabinet width={60} height={30} />
      </div>
      
      {/* Wall */}
      <div className="absolute" style={{ left: `${wallX}px`, top: `${wallY}px` }}>
        <Wall />
      </div>
      
      {/* Vertical pairs next to wall */}
      {Array.from({ length: 2 }).map((_, colIdx) =>
        Array.from({ length: 6 }).map((_, pairIdx) => {
          const deskNumber = 28 + (colIdx * 6 * 2) + (pairIdx * 2);
          return (
            <VerticalPair 
              key={`part5-col${colIdx}-pair${pairIdx}`} 
              x={verticalStartX + colIdx * verticalPairWidth} 
              y={verticalStartY + pairIdx * 80}
              deskNumber={deskNumber}
            />
          );
        })
      )}
    </>
  );
}
