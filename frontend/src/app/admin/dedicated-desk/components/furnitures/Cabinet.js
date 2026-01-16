"use client";

export default function Cabinet({ width = 40, height = 60, className = "" }) {
  return (
    <div
      className={`bg-white border-2 border-black rounded-sm ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
