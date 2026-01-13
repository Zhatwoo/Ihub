'use client';

import { useState } from 'react';
import ColorWheel from './ColorWheel';

export default function ToolRibbon({ 
  selectedItem, 
  onToolSelect, 
  onItemUpdate,
  activeTool,
  setActiveTool,
  showGridlines,
  setShowGridlines,
  showRulers,
  setShowRulers,
  editingText = null,
  canvasData = null
}) {
  const [showColorWheel, setShowColorWheel] = useState(false);
  const [showOutlineWheel, setShowOutlineWheel] = useState(false);
  const [shapeColor, setShapeColor] = useState('#3b82f6');
  const [outlineColor, setOutlineColor] = useState('#2563eb');

  // Lines and Shapes tools
  const lineShapeTools = [
    { id: 'line', name: 'Line', icon: '─' },
    { id: 'rectangle', name: 'Rectangle', icon: '▭' },
    { id: 'circle', name: 'Circle', icon: '○' },
    { id: 'polygon', name: 'Polygon', icon: '⬟' },
    { id: 'text', name: 'Text', icon: 'T' },
  ];

  // Handle tool selection
  const handleToolSelect = (toolId) => {
    setActiveTool(toolId);
    if (onToolSelect) {
      onToolSelect(toolId);
    }
  };

  // Handle color change for selected item
  const handleColorChange = (color) => {
    setShapeColor(color);
    if (selectedItem && onItemUpdate) {
      onItemUpdate(selectedItem.id, { fillColor: color });
    }
  };

  // Handle outline color change
  const handleOutlineColorChange = (color) => {
    setOutlineColor(color);
    if (selectedItem && onItemUpdate) {
      onItemUpdate(selectedItem.id, { strokeColor: color });
    }
  };

  // Handle dimension update
  const handleDimensionUpdate = (dimension, value) => {
    if (selectedItem && onItemUpdate) {
      const numValue = parseFloat(value) || 0;
      onItemUpdate(selectedItem.id, { [dimension]: numValue });
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-lg shadow-slate-800/5 border border-gray-200">
      <div className="p-4">
        <div className="flex flex-wrap gap-6 items-start">
          {/* Lines and Shapes Section */}
          <div className="flex-1 min-w-[200px] border-r border-gray-200 pr-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Lines and Shapes</h3>
            <div className="flex flex-wrap gap-2">
              {lineShapeTools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    activeTool === tool.id
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={tool.name}
                >
                  <span className="text-lg">{tool.icon}</span>
                  <span className="text-sm">{tool.name}</span>
                </button>
              ))}
            </div>

            {/* Color and Outline Controls (shown when item is selected) */}
            {selectedItem && (
              <div className="mt-4 flex flex-wrap gap-4 items-center">
                {/* Fill Color */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Fill Color:</label>
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowColorWheel(!showColorWheel);
                        setShowOutlineWheel(false);
                      }}
                      className="w-10 h-10 rounded border-2 border-gray-300"
                      style={{ backgroundColor: selectedItem.fillColor || shapeColor }}
                    />
                    {showColorWheel && (
                      <div className="absolute top-12 left-0 z-50">
                        <ColorWheel
                          color={selectedItem.fillColor || shapeColor}
                          onChange={(color) => handleColorChange(color)}
                          onClose={() => setShowColorWheel(false)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Outline Color */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Outline:</label>
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowOutlineWheel(!showOutlineWheel);
                        setShowColorWheel(false);
                      }}
                      className="w-10 h-10 rounded border-2 border-gray-300"
                      style={{ backgroundColor: selectedItem.strokeColor || outlineColor }}
                    />
                    {showOutlineWheel && (
                      <div className="absolute top-12 left-0 z-50">
                        <ColorWheel
                          color={selectedItem.strokeColor || outlineColor}
                          onChange={(color) => handleOutlineColorChange(color)}
                          onClose={() => setShowOutlineWheel(false)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Page Options Section */}
          <div className="flex-1 min-w-[200px] border-r border-gray-200 pr-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Page Options</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGridlines}
                  onChange={(e) => setShowGridlines(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Gridlines</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRulers}
                  onChange={(e) => setShowRulers(e.target.checked)}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Rulers</span>
              </label>
            </div>
          </div>

          {/* Text Options Section - Only shown when editing text */}
          {editingText && (() => {
            // Use a more robust lookup that handles updates
            const textItem = canvasData?.items?.find(i => i.id === editingText);
            // If item not found, still show the section but with default values
            // This prevents the section from disappearing during updates
            if (!textItem && editingText) {
              // Item might be updating, keep the section visible
              return (
                <div className="flex-1 min-w-[200px] border-r border-gray-200 pr-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Text Options</h3>
                  <div className="flex flex-col gap-3">
                    <div className="text-xs text-gray-500">Loading...</div>
                  </div>
                </div>
              );
            }
            if (!textItem) return null;
            
            return (
              <div className="flex-1 min-w-[200px] border-r border-gray-200 pr-6 text-options-container">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Text Options</h3>
                <div className="flex flex-col gap-3">
                  {/* Font Style */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Font Style</label>
                    <select
                      value={textItem.fontFamily || 'Arial'}
                      onChange={(e) => {
                        if (onItemUpdate) {
                          onItemUpdate(editingText, { fontFamily: e.target.value });
                        }
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Comic Sans MS">Comic Sans MS</option>
                      <option value="Impact">Impact</option>
                      <option value="Trebuchet MS">Trebuchet MS</option>
                    </select>
                  </div>
                  
                  {/* Font Size */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Font Size</label>
                    <input
                      type="number"
                      min="8"
                      max="200"
                      value={textItem.fontSize || 16}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty value while typing
                        if (value === '') {
                          if (onItemUpdate && editingText) {
                            onItemUpdate(editingText, { fontSize: '' });
                          }
                          return;
                        }
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 8 && numValue <= 200) {
                          if (onItemUpdate && editingText) {
                            onItemUpdate(editingText, { fontSize: numValue });
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // If empty on blur, set to default
                        const value = e.target.value;
                        if (value === '' || isNaN(parseInt(value))) {
                          if (onItemUpdate && editingText) {
                            onItemUpdate(editingText, { fontSize: 16 });
                          }
                        }
                      }}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  
                  {/* Font Color */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Font Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textItem.textColor || textItem.fillColor || '#000000'}
                        onChange={(e) => {
                          if (onItemUpdate && editingText) {
                            onItemUpdate(editingText, { textColor: e.target.value });
                          }
                        }}
                        onFocus={(e) => e.stopPropagation()}
                        className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <span className="text-xs text-gray-500">
                        {textItem.textColor || textItem.fillColor || '#000000'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Dimensions Section - Only shown when item is selected */}
          {selectedItem && (
            <div className="flex-1 min-w-[200px]">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Dimensions</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">X Position</label>
                  <input
                    type="number"
                    value={selectedItem.x ?? 0}
                    onChange={(e) => {
                      const numValue = parseFloat(e.target.value) || 0;
                      handleDimensionUpdate('x', numValue);
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Y Position</label>
                  <input
                    type="number"
                    value={selectedItem.y ?? 0}
                    onChange={(e) => {
                      const numValue = parseFloat(e.target.value) || 0;
                      handleDimensionUpdate('y', numValue);
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Width</label>
                  <input
                    type="number"
                    value={selectedItem.width || 60}
                    onChange={(e) => handleDimensionUpdate('width', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Height</label>
                  <input
                    type="number"
                    value={selectedItem.height || 40}
                    onChange={(e) => handleDimensionUpdate('height', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
