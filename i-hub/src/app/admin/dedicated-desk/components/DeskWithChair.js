"use client";

export default function DeskWithChair({ onClick, orientation = "horizontal-top", className = "", thinOutline = false }) {
  const isHorizontal = orientation.startsWith("horizontal");
  const containerWidth = isHorizontal ? "90px" : "90px";
  const containerHeight = isHorizontal ? "70px" : "90px";
  
  const deskBg = thinOutline ? "bg-gray-400 border-2 border-black" : "bg-black";

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer transition-transform hover:scale-105 ${className}`}
      style={{ width: containerWidth, height: containerHeight }}
    >
      {orientation === "horizontal-top" ? (
        <>
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
            style={{ width: "20px", height: "20px", top: "0px" }}
          />
          <div
            className={`absolute left-1/2 -translate-x-1/2 rounded-sm ${deskBg}`}
            style={{ width: "80px", height: "40px", top: "26px" }}
          >
            {!thinOutline && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gray-400"
                style={{ width: "70px", height: "30px" }}
              />
            )}
          </div>
        </>
      ) : orientation === "horizontal-bottom" ? (
        <>
          <div
            className={`absolute left-1/2 -translate-x-1/2 rounded-sm ${deskBg}`}
            style={{ width: "80px", height: "40px", top: "0px" }}
          >
            {!thinOutline && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gray-400"
                style={{ width: "70px", height: "30px" }}
              />
            )}
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
            style={{ width: "20px", height: "20px", top: "46px" }}
          />
        </>
      ) : orientation === "vertical-left" ? (
        <>
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full bg-black"
            style={{ width: "20px", height: "20px", left: "0px" }}
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 rounded-sm ${deskBg}`}
            style={{ width: "40px", height: "80px", left: "26px" }}
          >
            {!thinOutline && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gray-400"
                style={{ width: "30px", height: "70px" }}
              />
            )}
          </div>
        </>
      ) : orientation === "vertical-right" ? (
        <>
          <div
            className={`absolute top-1/2 -translate-y-1/2 rounded-sm ${deskBg}`}
            style={{ width: "40px", height: "80px", left: "0px" }}
          >
            {!thinOutline && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gray-400"
                style={{ width: "30px", height: "70px" }}
              />
            )}
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full bg-black"
            style={{ width: "20px", height: "20px", left: "46px" }}
          />
        </>
      ) : null}
    </div>
  );
}
