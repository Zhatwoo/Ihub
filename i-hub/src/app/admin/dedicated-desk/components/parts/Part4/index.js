"use client";

import DeskWithChair from "../../DeskWithChair";
import Wall from "../../Wall";
import Cabinet from "../../Cabinet";

export default function Part4({ onDeskClick, startX, startY, wallAlignX, wallAlignY, tagPrefix = "D", deskAssignments = {}, zoom = 1, isStandalone = false, showPrivateInfo = true }) {
  const deskWidth = 80;
  const horizontalContainerHeight = 70;
  const rowGap = 20;
  const pairHeight = 136;
  
  // When standalone, use local positioning; otherwise use passed props
  const baseX = isStandalone ? 0 : startX;
  const baseY = isStandalone ? 115 : startY;
  const wallX = isStandalone ? 480 : wallAlignX;
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

  const VerticalPair = ({ x, y, deskNumber, thinOutline = false }) => {
    const leftTag = getTag(deskNumber);
    const rightTag = getTag(deskNumber + 1);
    
    return (
      <div className="absolute" style={{ left: `${x}px`, top: `${y}px` }}>
        <div className="flex flex-row items-center">
          <DeskWithChair 
            orientation="vertical-left" 
            onClick={() => onDeskClick(leftTag)} 
            thinOutline={thinOutline}
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
              thinOutline={thinOutline}
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

  // Top row with vertical pairs and middle desk - matching reference spacing
  const topRowY = baseY;
  const vertical1X = baseX + 7;
  const vertical2X = baseX + 287;
  const middleDeskX = baseX + 147;
  const middleDeskY = topRowY + 5;
  
  // Row 1: 6 single desks (chairs on bottom)
  const row1Y = topRowY + 85;
  
  // Row 2: 5 horizontal pairs + cabinet
  const row2Y = row1Y + horizontalContainerHeight + rowGap - 5;
  
  return (
    <>
      {/* Wall */}
      <div className="absolute" style={{ left: `${wallX}px`, top: `${wallY}px` }}>
        <Wall />
      </div>
      
      {/* Cabinets next to wall */}
      {Array.from({ length: 4 }).map((_, idx) => (
        <div 
          key={`part4-cabinet-${idx}`} 
          className="absolute" 
          style={{ 
            left: `${wallX + 25}px`, 
            top: `${wallY + 120 + idx * 60}px` 
          }}
        >
          <Cabinet width={30} height={60} />
        </div>
      ))}
      
      {/* Top cabinets */}
      <div className="absolute" style={{ left: `${wallX + 120}px`, top: `${wallY}px` }}>
        <Cabinet width={60} height={30} />
      </div>
      <div className="absolute" style={{ left: `${wallX + 180}px`, top: `${wallY}px` }}>
        <Cabinet width={60} height={30} />
      </div>
      
      {/* Top row: 2 vertical pairs + 1 middle desk */}
      <VerticalPair 
        x={vertical1X} 
        y={topRowY} 
        deskNumber={1}
        thinOutline={true}
      />
      
      <div className="absolute" style={{ left: `${middleDeskX}px`, top: `${middleDeskY}px` }}>
        <DeskWithChair 
          orientation="horizontal-bottom" 
          onClick={() => onDeskClick(getTag(3))} 
          thinOutline={true}
          isOccupied={!!deskAssignments[getTag(3)]}
          occupantType={deskAssignments[getTag(3)]?.type || "Employee"}
          occupantName={deskAssignments[getTag(3)]?.name || ""}
          zoom={zoom}
          showPrivateInfo={showPrivateInfo}
        />
      </div>
      
      <VerticalPair 
        x={vertical2X} 
        y={topRowY} 
        deskNumber={4}
        thinOutline={true}
      />
      
      {/* Row 1: 6 single desks */}
      {Array.from({ length: 6 }).map((_, idx) => {
        const deskNumber = 6 + idx;
        const tag = getTag(deskNumber);
        return (
          <div key={`part4-row1-${idx}`} className="absolute" style={{ 
            left: `${baseX + idx * deskWidth}px`, 
            top: `${row1Y}px` 
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
      
      {/* Row 2: 5 horizontal pairs */}
      {Array.from({ length: 5 }).map((_, pairIdx) => {
        const deskNumber = 12 + (pairIdx * 2);
        return (
          <HorizontalPair 
            key={`part4-row2-${pairIdx}`} 
            x={baseX + pairIdx * deskWidth} 
            y={row2Y}
            deskNumber={deskNumber}
          />
        );
      })}
      
      {/* Cabinet next to row 2 */}
      <div 
        className="absolute" 
        style={{ 
          left: `${baseX + 5 * deskWidth + 5}px`, 
          top: `${row2Y + 30}px` 
        }}
      >
        <Cabinet width={30} height={60} />
      </div>
      
      {/* L-shaped desk */}
      <div 
        className="absolute cursor-pointer transition-transform hover:scale-105 relative"
        style={{ 
          left: `${wallX + 50}px`, 
          top: `${wallY + 120 + 2 * 60 - 26}px` 
        }}
        onClick={() => onDeskClick(getTag(22))}
      >
        <DeskWithChair 
          orientation="horizontal-top" 
          thinOutline={true} 
          onClick={() => {}}
          isOccupied={!!deskAssignments[getTag(22)]}
          occupantType={deskAssignments[getTag(22)]?.type || "Employee"}
          occupantName={deskAssignments[getTag(22)]?.name || ""}
          zoom={zoom}
          showPrivateInfo={showPrivateInfo}
        />
        <div style={{ position: 'absolute', left: '5px', top: '61px' }}>
          <DeskWithChair 
            orientation="vertical-right" 
            thinOutline={true} 
            onClick={() => {}}
            isOccupied={!!deskAssignments[getTag(22)]}
            occupantType={deskAssignments[getTag(22)]?.type || "Employee"}
            occupantName={deskAssignments[getTag(22)]?.name || ""}
            zoom={zoom}
            showPrivateInfo={showPrivateInfo}
          />
        </div>
        {deskAssignments[getTag(22)] && (
          <div 
            className={`absolute inset-0 ${deskAssignments[getTag(22)]?.type === "Tenant" ? "bg-blue-500" : "bg-red-500"} rounded-sm z-10 pointer-events-none`}
            style={{ opacity: 0.35, width: '90px', height: '90px' }}
          />
        )}
      </div>
    </>
  );
}
