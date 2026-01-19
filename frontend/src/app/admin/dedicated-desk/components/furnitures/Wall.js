"use client";

export default function Wall({ className = "", width = 120, height = 120 }) {
  return (
    <div
      className={`bg-black ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}
