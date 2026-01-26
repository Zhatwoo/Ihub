import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import DeskWithChair from "../../furnitures/DeskWithChair";
import Wall from "../../furnitures/Wall";

export default function Part3({ onDeskClick, startX = 0, tagPrefix = "C", deskAssignments = {}, zoom = 1, isStandalone = false, showPrivateInfo = true }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const customDeskRef = useRef(null);
  const deskHeight = 80;
  const verticalPairWidth = 156;
  const verticalContainerWidth = 90;
  const wallSize = 120;

  const baseX = isStandalone ? 0 : startX;

  const getTag = (deskNumber) => `${tagPrefix}${deskNumber}`;

  // Calculate tooltip position for custom desk C32 (same logic as DeskWithChair)
  useEffect(() => {
    if (showTooltip && customDeskRef.current) {
      const updateTooltipPosition = () => {
        const rect = customDeskRef.current.getBoundingClientRect();
        const tooltipWidth = 50;
        const tooltipHeight = 24;
        
        setTooltipPosition({
          top: rect.top - tooltipHeight - 3,
          left: rect.left + (rect.width / 2) - (tooltipWidth / 2)
        });
      };
      
      updateTooltipPosition();
      window.addEventListener('scroll', updateTooltipPosition, true);
      window.addEventListener('resize', updateTooltipPosition);
      
      return () => {
        window.removeEventListener('scroll', updateTooltipPosition, true);
        window.removeEventListener('resize', updateTooltipPosition);
      };
    }
  }, [showTooltip]);

  // Tooltip styling (same as DeskWithChair)
  const tooltipScale = zoom < 1 ? Math.min(1 / zoom, 2) : 1;
  const clampedScale = tooltipScale;
  const isByPartView = Number(zoom) === 1;
  const basePadding = isByPartView ? '10px 16px' : '3px 6px';
  const baseNameSize = isByPartView ? '16px' : '9px';
  const baseTypeSize = isByPartView ? '12px' : '8px';

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

  const col4X = baseX + verticalContainerWidth + 2 * verticalPairWidth;
  const wallX = col4X + 26 + 40 - 60;
  const firstDeskY = wallSize - 5;

  return (
    <>
      {Array.from({ length: 6 }).map((_, rowIdx) => {
        const deskNumber = rowIdx + 1;
        const tag = getTag(deskNumber);
        return (
          <div key={`part3-col0-${rowIdx}`} className="absolute" style={{ 
            left: `${baseX}px`, 
            top: `${wallSize - 5 + rowIdx * deskHeight}px` 
          }}>
            <DeskWithChair 
              orientation="vertical-right" 
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
      
      {Array.from({ length: 2 }).map((_, colIdx) => {
        const columnX = baseX + verticalContainerWidth + colIdx * verticalPairWidth;
        return Array.from({ length: 6 }).map((_, rowIdx) => {
          const deskNumber = 7 + (colIdx * 6 * 2) + (rowIdx * 2);
          return (
            <VerticalPair 
              key={`part3-col${colIdx + 1}-pair${rowIdx}`} 
              x={columnX} 
              y={wallSize - 5 + rowIdx * deskHeight}
              deskNumber={deskNumber}
            />
          );
        });
      })}
      
      <div className="absolute" style={{ left: `${wallX}px`, top: "0px" }}>
        <Wall />
      </div>
      
      <div className="absolute" style={{ left: `${col4X}px`, top: `${firstDeskY}px` }}>
        <div className="flex flex-row items-start">
          <DeskWithChair 
            orientation="vertical-left" 
            onClick={() => onDeskClick(getTag(31))}
            isOccupied={!!deskAssignments[getTag(31)]}
            occupantType={deskAssignments[getTag(31)]?.type || "Employee"}
            occupantName={deskAssignments[getTag(31)]?.name || ""}
            zoom={zoom}
            showPrivateInfo={showPrivateInfo}
          />
          <div 
            ref={customDeskRef}
            className="relative cursor-pointer transition-transform hover:scale-105" 
            style={{ 
              marginLeft: "-24px",
              width: "110px", 
              height: "90px"
            }}
            onClick={() => onDeskClick(getTag(32))}
            onMouseEnter={() => deskAssignments[getTag(32)] && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="relative" style={{ width: "40px", height: "90px" }}>
              <div className="absolute top-1/2 -translate-y-1/2 rounded-sm bg-black" style={{ width: "40px", height: "80px", left: "0px" }}>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gray-400" style={{ width: "30px", height: "70px" }} />
              </div>
            </div>
            <div className="absolute" style={{ left: "40px", top: "50px" }}>
              <div className="bg-gray-400 rounded-sm" style={{ width: "70px", height: "30px" }} />
            </div>
            <div className="absolute rounded-full bg-black" style={{ width: "20px", height: "20px", left: "65px", top: "25px" }} />
            {deskAssignments[getTag(32)] && (
              <div 
                className={`absolute ${deskAssignments[getTag(32)]?.type === "Tenant" ? "bg-blue-500" : "bg-red-500"} rounded-sm z-10 pointer-events-none`}
                style={{ 
                  opacity: 0.35,
                  top: '0px',
                  left: '0px',
                  width: '110px',
                  height: '90px'
                }}
              />
            )}
          </div>
        </div>
      </div>
      
      {Array.from({ length: 5 }).map((_, rowIdx) => {
        const deskNumber = 33 + (rowIdx * 2);
        return (
          <VerticalPair 
            key={`part3-col3-pair${rowIdx + 1}`} 
            x={col4X} 
            y={firstDeskY + (rowIdx + 1) * deskHeight}
            deskNumber={deskNumber}
          />
        );
      })}
      
      <div className="absolute" style={{ 
        left: `${baseX + verticalContainerWidth + 26 + (80 - 60) / 2}px`, 
        top: `${wallSize - 5 + 6 * deskHeight + 5}px` 
      }}>
        <div className="bg-white border-2 border-black rounded-sm" style={{ width: "60px", height: "30px" }} />
      </div>
      
      <div className="absolute" style={{ 
        left: `${baseX + verticalContainerWidth + verticalPairWidth + 26 + (80 - 60) / 2}px`, 
        top: `${wallSize - 5 + 6 * deskHeight + 5}px` 
      }}>
        <div className="bg-white border-2 border-black rounded-sm" style={{ width: "60px", height: "30px" }} />
      </div>
      
      <div className="absolute" style={{ 
        left: `${col4X + 26 + (80 - 60) / 2}px`, 
        top: `${firstDeskY + 6 * deskHeight + 5}px` 
      }}>
        <div className="bg-white border-2 border-black rounded-sm" style={{ width: "60px", height: "30px" }} />
      </div>

      {/* Custom Desk C32 Tooltip - Same as DeskWithChair */}
      {deskAssignments[getTag(32)] && showTooltip && typeof window !== 'undefined' ? createPortal(
        <div 
          className="fixed pointer-events-none z-99999"
          style={{ 
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: `scale(${clampedScale})`,
            transformOrigin: 'bottom center'
          }}
        >
          <div 
            className="bg-slate-800 text-white rounded shadow-lg text-center border border-slate-700 whitespace-nowrap"
            style={{
              padding: basePadding,
              minWidth: isByPartView ? '80px' : '30px',
              maxWidth: isByPartView ? '160px' : '60px',
              lineHeight: 1
            }}
          >
            {showPrivateInfo && deskAssignments[getTag(32)]?.name ? (
              <>
                <div className="font-medium" style={{ fontSize: baseNameSize, marginBottom: 0, lineHeight: 1 }}>
                  {deskAssignments[getTag(32)].name}
                </div>
                <div className={`px-0.5 py-0 rounded-full inline-block ${
                  deskAssignments[getTag(32)].type === "Tenant" 
                    ? "bg-blue-500/30 text-blue-200" 
                    : "bg-red-500/30 text-red-200"
                }`} style={{ fontSize: baseTypeSize, lineHeight: 1, marginTop: 0 }}>
                  {deskAssignments[getTag(32)].type || 'Employee'}
                </div>
              </>
            ) : (
              <div className="font-medium" style={{ fontSize: baseNameSize, lineHeight: 1 }}>Occupied</div>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-slate-800"></div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
