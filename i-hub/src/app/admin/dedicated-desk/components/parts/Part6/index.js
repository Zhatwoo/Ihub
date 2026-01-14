"use client";

import Wall from "../../Wall";
import DeskWithChair from "../../DeskWithChair";

export default function Part6({ onDeskClick, wallAlignX, wallAlignY, tagPrefix = "F", deskAssignments = {}, zoom = 1 }) {
  const wallSize = 120;
  const deskHeight = 80;
  const verticalPairWidth = 156;
  
  const wallX = wallAlignX;
  const wallY = wallAlignY;
  const desksStartY = wallY + wallSize - 5;
  const desksStartX = wallX + 20 - 26;
  const col2StartX = desksStartX + verticalPairWidth;
  const col2StartY = desksStartY - deskHeight;
  const col3StartX = desksStartX - verticalPairWidth;
  const col3StartY = col2StartY;

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
  
  return (
    <>
      <div className="absolute" style={{ left: `${wallX}px`, top: `${wallY}px` }}>
        <Wall />
      </div>
      
      {Array.from({ length: 4 }).map((_, idx) => {
        const deskNumber = 1 + idx; // F1-F4
        const tag = getTag(deskNumber);
        return (
          <div 
            key={`part6-col3-desk-${idx}`} 
            className="absolute" 
            style={{ 
              left: `${col3StartX + 66}px`, 
              top: `${col3StartY + idx * deskHeight}px` 
            }}
          >
            <DeskWithChair 
              orientation="vertical-right" 
              onClick={() => onDeskClick(tag)}
              isOccupied={!!deskAssignments[tag]}
              occupantType={deskAssignments[tag]?.type || "Employee"}
              occupantName={deskAssignments[tag]?.name || ""}
            />
          </div>
        );
      })}
      
      <div 
        className="absolute" 
        style={{ 
          left: `${col3StartX + 66 - 85}px`, 
          top: `${col3StartY + 5}px` 
        }}
      >
        <DeskWithChair 
          orientation="horizontal-top" 
          onClick={() => onDeskClick(getTag(5))} 
          thinOutline={true}
          isOccupied={!!deskAssignments[getTag(5)]}
          occupantType={deskAssignments[getTag(5)]?.type || "Employee"}
          occupantName={deskAssignments[getTag(5)]?.name || ""}
          zoom={zoom}
        />
      </div>
      
      {Array.from({ length: 3 }).map((_, idx) => {
        const deskNumber = 6 + (idx * 2); // F6-F11
        return (
          <VerticalPair 
            key={`part6-col1-pair-${idx}`} 
            x={desksStartX} 
            y={desksStartY + idx * deskHeight}
            deskNumber={deskNumber}
          />
        );
      })}
      
      {Array.from({ length: 4 }).map((_, idx) => {
        const deskNumber = 12 + (idx * 2); // F12-F19
        return (
          <VerticalPair 
            key={`part6-col2-pair-${idx}`} 
            x={col2StartX} 
            y={col2StartY + idx * deskHeight}
            deskNumber={deskNumber}
          />
        );
      })}
      
      <div 
        className="absolute" 
        style={{ 
          left: `${col3StartX + 66 - 85}px`, 
          top: `${col3StartY + 2 * deskHeight + 5}px` 
        }}
      >
        <DeskWithChair 
          orientation="horizontal-top" 
          onClick={() => onDeskClick(getTag(20))} 
          thinOutline={true}
          isOccupied={!!deskAssignments[getTag(20)]}
          occupantType={deskAssignments[getTag(20)]?.type || "Employee"}
          occupantName={deskAssignments[getTag(20)]?.name || ""}
          zoom={zoom}
        />
      </div>
      
      <div 
        className="absolute" 
        style={{ 
          left: `${col3StartX + 66 - 85 - 80}px`, 
          top: `${col3StartY + 2 * deskHeight + 5}px` 
        }}
      >
        <DeskWithChair 
          orientation="horizontal-top" 
          onClick={() => onDeskClick(getTag(21))} 
          thinOutline={true}
          isOccupied={!!deskAssignments[getTag(21)]}
          occupantType={deskAssignments[getTag(21)]?.type || "Employee"}
          occupantName={deskAssignments[getTag(21)]?.name || ""}
          zoom={zoom}
        />
      </div>
      
      {Array.from({ length: 2 }).map((_, idx) => {
        const deskNumber = 22 + (idx * 2); // F22-F25
        return (
          <VerticalPair 
            key={`part6-col4-pair-${idx}`} 
            x={col3StartX + 66 - 85 - 80 - 90} 
            y={col2StartY + idx * deskHeight}
            deskNumber={deskNumber}
          />
        );
      })}
      
      <div 
        className="absolute" 
        style={{ 
          left: `${col3StartX + 66 - 85 - 80 - 90}px`, 
          top: `${col2StartY + 2 * deskHeight}px` 
        }}
      >
        <DeskWithChair 
          orientation="vertical-left" 
          onClick={() => onDeskClick(getTag(26))}
          isOccupied={!!deskAssignments[getTag(26)]}
          occupantType={deskAssignments[getTag(26)]?.type || "Employee"}
          occupantName={deskAssignments[getTag(26)]?.name || ""}
          zoom={zoom}
        />
      </div>
      
      <div 
        className="absolute cursor-pointer transition-transform hover:scale-105 relative" 
        style={{ 
          left: `${col3StartX + 66 - 85 - 80 - 90 + 66}px`, 
          top: `${col2StartY + 2 * deskHeight + 5}px` 
        }}
        onClick={() => onDeskClick(getTag(27))}
      >
        <div className="bg-black rounded-sm" style={{ width: "40px", height: "80px" }}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gray-400" style={{ width: "30px", height: "70px" }} />
        </div>
        {/* Color overlay for occupied desk */}
        {deskAssignments[getTag(27)] && (
          <div 
            className={`absolute inset-0 ${deskAssignments[getTag(27)]?.type === "Tenant" ? "bg-blue-500" : "bg-red-500"} rounded-sm z-10 pointer-events-none`}
            style={{ opacity: 0.35, width: '40px', height: '80px' }}
          />
        )}
      </div>
      
      {Array.from({ length: 3 }).map((_, idx) => {
        const deskNumber = 28 + (idx * 2); // F28-F33
        return (
          <VerticalPair 
            key={`part6-col5-pair-${idx}`} 
            x={col3StartX + 66 - 85 - 80 - 90 - verticalPairWidth} 
            y={col2StartY + idx * deskHeight}
            deskNumber={deskNumber}
          />
        );
      })}
    </>
  );
}
