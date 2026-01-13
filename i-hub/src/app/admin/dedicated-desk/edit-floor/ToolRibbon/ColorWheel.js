'use client';

import { useState, useRef, useEffect } from 'react';

export default function ColorWheel({ color, onChange, onClose }) {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [alpha, setAlpha] = useState(1);
  const wheelRef = useRef(null);
  const pickerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert hex to HSL
  const hexToHsl = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
        default: h = 0;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  // Convert HSL to hex
  const hslToHex = (h, s, l) => {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Initialize from color prop
  useEffect(() => {
    if (color) {
      const hsl = hexToHsl(color);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
    }
  }, [color]);

  // Track if color prop changed externally
  const prevColorRef = useRef(color);
  const isInternalChange = useRef(false);
  
  useEffect(() => {
    if (color !== prevColorRef.current && !isInternalChange.current) {
      // External color change, update HSL
      const hsl = hexToHsl(color);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
      prevColorRef.current = color;
    }
    isInternalChange.current = false;
  }, [color]);
  
  // Update color when HSL changes (but not on initial mount)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevColorRef.current = color;
      return;
    }
    const hex = hslToHex(hue, saturation, lightness);
    if (onChange && hex !== prevColorRef.current) {
      isInternalChange.current = true;
      prevColorRef.current = hex;
      onChange(hex);
    }
  }, [hue, saturation, lightness, onChange]);

  const handleWheelClick = (e) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const angle = Math.atan2(y, x) * 180 / Math.PI;
    const newHue = (angle + 90 + 360) % 360;
    setHue(newHue);
  };

  const handlePickerClick = (e) => {
    if (!pickerRef.current) return;
    const rect = pickerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    setSaturation(Math.round((x / rect.width) * 100));
    setLightness(Math.round(100 - (y / rect.height) * 100));
  };

  const currentColor = hslToHex(hue, saturation, lightness);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50">
      <div className="flex gap-4">
        {/* Color Wheel */}
        <div className="flex flex-col gap-3">
          {/* Hue Wheel */}
          <div
            ref={wheelRef}
            onClick={handleWheelClick}
            className="w-32 h-32 rounded-full cursor-crosshair relative"
            style={{
              background: `conic-gradient(
                hsl(0, 100%, 50%),
                hsl(60, 100%, 50%),
                hsl(120, 100%, 50%),
                hsl(180, 100%, 50%),
                hsl(240, 100%, 50%),
                hsl(300, 100%, 50%),
                hsl(360, 100%, 50%)
              )`
            }}
          >
            <div
              className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${hue}deg) translateY(-56px)`,
                transformOrigin: 'center'
              }}
            />
          </div>

          {/* Saturation/Lightness Picker */}
          <div
            ref={pickerRef}
            onClick={handlePickerClick}
            className="w-32 h-32 rounded cursor-crosshair relative"
            style={{
              background: `linear-gradient(to top, black, transparent), linear-gradient(to right, white, hsl(${hue}, 100%, 50%))`
            }}
          >
            <div
              className="absolute w-3 h-3 border-2 border-white rounded-full shadow-lg pointer-events-none"
              style={{
                left: `${saturation}%`,
                top: `${100 - lightness}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
        </div>

        {/* Color Preview and Inputs */}
        <div className="flex flex-col gap-3">
          <div>
            <div
              className="w-full h-16 rounded border-2 border-gray-300 mb-2"
              style={{ backgroundColor: currentColor }}
            />
            <input
              type="text"
              value={currentColor}
              onChange={(e) => {
                const hex = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(hex)) {
                  const hsl = hexToHsl(hex);
                  setHue(hsl.h);
                  setSaturation(hsl.s);
                  setLightness(hsl.l);
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="#000000"
            />
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-gray-600 mb-1">H: {hue}°</label>
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => setHue(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">S: {saturation}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={saturation}
                onChange={(e) => setSaturation(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">L: {lightness}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={lightness}
                onChange={(e) => setLightness(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

