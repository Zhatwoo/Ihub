"use client";

import DeskWithChair from "../../DeskWithChair";
import Wall from "../../Wall";
import Cabinet from "../../Cabinet";

export default function Part4({ onDeskClick, startX, startY, wallAlignX, wallAlignY, tagPrefix = "D" }) {
  const deskWidth = 80;
  const horizontalContainerHeight = 70;
  const verticalPairWidth = 156;
  const rowGap = 20;
  
  const wallX = wallAlignX;
  const wallY = wallAlignY;

  const getTag = (deskNumber) => `${tagPrefix}${deskNumber}`;

  const HorizontalPair = ({ x, y, deskNumber }) => {
    const topTag = getTag(deskNumber);
    const bottomTag = getTag(deskNumber + 1);
    
    return (
      <div className="absolute" style={{ left: `${x}px`, top: `${y}px` }}>
        <div className="flex flex-col items-center">
          <DeskWithChair orientation="horizontal-top" onClick={() => onDeskClick(topTag)} />
          <div style={{ marginTop: "-4px" }}>
            <DeskWithChair orientation="horizontal-bottom" onClick={() => onDeskClick(bottomTag)} />
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
          <DeskWithChair orientation="vertical-left" onClick={() => onDeskClick(leftTag)} thinOutline={thinOutline} />
          <div style={{ marginLeft: "-24px" }}>
            <DeskWithChair orientation="vertical-right" onClick={() => onDeskClick(rightTag)} thinOutline={thinOutline} />
          </div>
        </div>
      </div>
    );
  };

  const row1Y = startY + 100;
  const verticalTopY = row1Y - 85;
  const vertical1X = startX + 85 - 78 + 10;
  const vertical2X = startX + 325 - 78 + 10;
  const middleDeskX = startX + 205 - 45;
  const middleDeskY = verticalTopY + 5;
  
  // Calculate desk numbers: D1-D2 (vertical pair), D3 (middle), D4-D5 (vertical pair), D6-D10 (row1), D11-D20 (row2 pairs), D21 (L-desk)
  return (
    <>
      <div className="absolute" style={{ left: `${wallX}px`, top: `${wallY}px` }}>
        <Wall />
      </div>
      
      {Array.from({ length: 4 }).map((_, idx) => (
        <div 
          key={`part4-cabinet-${idx}`} 
          className="absolute" 
          style={{ 
            left: `${wallX + 60 - 15 - 20}px`, 
            top: `${wallY + 120 + idx * 60}px` 
          }}
        >
          <Cabinet width={30} height={60} />
        </div>
      ))}
      
      <VerticalPair 
        x={vertical1X} 
        y={verticalTopY} 
        deskNumber={1}
        thinOutline={true}
      />
      
      <div className="absolute" style={{ 
        left: `${middleDeskX}px`, 
        top: `${middleDeskY}px` 
      }}>
        <DeskWithChair orientation="horizontal-bottom" onClick={() => onDeskClick(getTag(3))} thinOutline={true} />
      </div>
      
      <VerticalPair 
        x={vertical2X} 
        y={verticalTopY} 
        deskNumber={4}
        thinOutline={true}
      />
      
      {Array.from({ length: 5 }).map((_, idx) => {
        const deskNumber = 6 + idx; // D6-D10
        const tag = getTag(deskNumber);
        return (
          <div key={`part4-row1-${idx}`} className="absolute" style={{ 
            left: `${startX + idx * deskWidth}px`, 
            top: `${row1Y}px` 
          }}>
            <DeskWithChair orientation="horizontal-bottom" onClick={() => onDeskClick(tag)} />
          </div>
        );
      })}
      
      {Array.from({ length: 5 }).map((_, pairIdx) => {
        const deskNumber = 11 + (pairIdx * 2); // D11-D20
        return (
          <HorizontalPair 
            key={`part4-row2-${pairIdx}`} 
            x={startX + pairIdx * deskWidth} 
            y={row1Y + horizontalContainerHeight + rowGap}
            deskNumber={deskNumber}
          />
        );
      })}
      
      <div 
        className="absolute" 
        style={{ 
          left: `${startX + 4 * deskWidth + 5 + 80}px`, 
          top: `${row1Y + horizontalContainerHeight + rowGap + 30}px` 
        }}
      >
        <Cabinet width={30} height={60} />
      </div>
      
      <div className="absolute" style={{ 
        left: `${wallX + 120}px`, 
        top: `${wallY}px` 
      }}>
        <Cabinet width={60} height={30} />
      </div>
      <div className="absolute" style={{ 
        left: `${wallX + 120 + 60}px`, 
        top: `${wallY}px` 
      }}>
        <Cabinet width={60} height={30} />
      </div>
      
      <div 
        className="absolute cursor-pointer transition-transform hover:scale-105"
        style={{ 
          left: `${wallX + 25 + 30 - 5}px`, 
          top: `${wallY + 120 + 2 * 60 - 26}px` 
        }}
        onClick={() => onDeskClick(getTag(21))}
      >
        <DeskWithChair orientation="horizontal-top" thinOutline={true} onClick={() => {}} />
        <div style={{ position: 'absolute', left: '5px', top: '61px' }}>
          <DeskWithChair orientation="vertical-right" thinOutline={true} onClick={() => {}} />
        </div>
      </div>
    </>
  );
}
