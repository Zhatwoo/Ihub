'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export default function EditFloor() {
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [floorName, setFloorName] = useState('');
  const [showFloorForm, setShowFloorForm] = useState(false);
  const [desks, setDesks] = useState([]);
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Handle floor creation
  const handleCreateFloor = () => {
    if (!floorName.trim()) return;
    
    const newFloor = {
      id: Date.now().toString(),
      name: floorName,
      desks: [],
      createdAt: new Date().toISOString()
    };
    
    setFloors([...floors, newFloor]);
    setSelectedFloor(newFloor.id);
    setFloorName('');
    setShowFloorForm(false);
    setDesks([]);
  };

  // Handle floor selection
  const handleSelectFloor = (floorId) => {
    const floor = floors.find(f => f.id === floorId);
    if (floor) {
      setSelectedFloor(floorId);
      setDesks(floor.desks || []);
    }
  };

  // Handle canvas click to add desk
  const handleCanvasClick = useCallback((e) => {
    if (!isDrawing || !selectedFloor) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newDesk = {
      id: Date.now().toString(),
      x: x,
      y: y,
      width: 60,
      height: 40,
      label: `Desk ${desks.length + 1}`,
      type: 'desk'
    };
    
    const updatedDesks = [...desks, newDesk];
    setDesks(updatedDesks);
    
    // Update floor with new desk
    const updatedFloors = floors.map(floor => 
      floor.id === selectedFloor 
        ? { ...floor, desks: updatedDesks }
        : floor
    );
    setFloors(updatedFloors);
  }, [isDrawing, selectedFloor, desks, floors]);

  // Handle desk selection
  const handleDeskSelect = (deskId) => {
    setSelectedDesk(deskId);
    setIsDrawing(false);
  };

  // Handle desk deletion
  const handleDeleteDesk = (deskId) => {
    const updatedDesks = desks.filter(d => d.id !== deskId);
    setDesks(updatedDesks);
    
    const updatedFloors = floors.map(floor => 
      floor.id === selectedFloor 
        ? { ...floor, desks: updatedDesks }
        : floor
    );
    setFloors(updatedFloors);
    
    if (selectedDesk === deskId) {
      setSelectedDesk(null);
    }
  };

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw desks
    desks.forEach(desk => {
      const isSelected = desk.id === selectedDesk;
      ctx.fillStyle = isSelected ? '#10b981' : '#3b82f6';
      ctx.strokeStyle = isSelected ? '#059669' : '#2563eb';
      ctx.lineWidth = isSelected ? 3 : 2;
      
      ctx.fillRect(desk.x, desk.y, desk.width, desk.height);
      ctx.strokeRect(desk.x, desk.y, desk.width, desk.height);
      
      // Draw label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(desk.label, desk.x + desk.width / 2, desk.y + desk.height / 2 + 4);
    });
  }, [desks, selectedDesk]);

  // Redraw canvas when desks change or component mounts
  useEffect(() => {
    if (canvasRef.current) {
      drawCanvas();
    }
  }, [desks, selectedDesk, drawCanvas]);

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Floor List Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-lg shadow-slate-800/5 border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Floors</h2>
              <button
                onClick={() => setShowFloorForm(!showFloorForm)}
                className="px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                + New Floor
              </button>
            </div>
            
            {showFloorForm && (
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <input
                  type="text"
                  value={floorName}
                  onChange={(e) => setFloorName(e.target.value)}
                  placeholder="Floor name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFloor()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateFloor}
                    className="flex-1 px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowFloorForm(false);
                      setFloorName('');
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {floors.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No floors created yet</p>
              ) : (
                floors.map(floor => (
                  <button
                    key={floor.id}
                    onClick={() => handleSelectFloor(floor.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedFloor === floor.id
                        ? 'bg-teal-100 text-teal-900 border-2 border-teal-600'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium">{floor.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {floor.desks?.length || 0} desks
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Floor Plan Editor */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-lg shadow-slate-800/5 border border-gray-200 p-4 sm:p-6">
            {!selectedFloor ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No Floor Selected</h3>
                <p className="text-gray-500 mb-6">Create a new floor or select an existing one to start editing</p>
                <button
                  onClick={() => setShowFloorForm(true)}
                  className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Create New Floor
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      {floors.find(f => f.id === selectedFloor)?.name || 'Floor Plan'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Click "Add Desk" and then click on the canvas to place desks
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsDrawing(!isDrawing)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isDrawing
                          ? 'bg-teal-600 text-white hover:bg-teal-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isDrawing ? 'Stop Adding' : 'Add Desk'}
                    </button>
                    {selectedDesk && (
                      <button
                        onClick={() => handleDeleteDesk(selectedDesk)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                      >
                        Delete Selected
                      </button>
                    )}
                  </div>
                </div>

                {/* Canvas Container */}
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="overflow-auto max-h-[600px]">
                    <canvas
                      ref={canvasRef}
                      width={canvasSize.width}
                      height={canvasSize.height}
                      onClick={handleCanvasClick}
                      className="cursor-crosshair"
                      style={{ display: 'block' }}
                    />
                  </div>
                </div>

                {/* Desk List */}
                {desks.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">Desks ({desks.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {desks.map(desk => (
                        <button
                          key={desk.id}
                          onClick={() => handleDeskSelect(desk.id)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedDesk === desk.id
                              ? 'bg-teal-100 text-teal-900 border-2 border-teal-600'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                          }`}
                        >
                          {desk.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

