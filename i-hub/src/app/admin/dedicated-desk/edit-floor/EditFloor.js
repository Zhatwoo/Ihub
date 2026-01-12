'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import Canvas from './Canvas/Canvas';
import ToolRibbon from './ToolRibbon/ToolRibbon';
import ZoomControl from './ZoomControl/ZoomControl';

export default function EditFloor() {
  const [floors, setFloors] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [canvasData, setCanvasData] = useState({ items: [] });
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [showGridlines, setShowGridlines] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoomToolActive, setZoomToolActive] = useState(false);
  const [editingText, setEditingText] = useState(null);
  
  // Floor creation form data
  const [floorFormData, setFloorFormData] = useState({
    name: '',
    description: ''
  });

  // Fetch floors from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'floors'), (snapshot) => {
      const floorsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setFloors(floorsData);
    });
    return () => unsubscribe();
  }, []);

  // Load canvas data when active tab changes
  useEffect(() => {
    if (activeTab) {
      const floor = floors.find(f => f.id === activeTab);
      if (floor && floor.canvasData) {
        setCanvasData(floor.canvasData);
      } else {
        setCanvasData({ items: [] });
      }
    } else {
      setCanvasData({ items: [] });
    }
  }, [activeTab, floors]);

  // Handle floor creation
  const handleCreateFloor = async () => {
    if (!floorFormData.name.trim()) {
      alert('Please enter a floor name');
      return;
    }
    
    setLoading(true);
    try {
      const newFloor = {
        name: floorFormData.name.trim(),
        description: floorFormData.description.trim(),
        canvasData: { items: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'floors'), newFloor);
      
      // Open in new page (blank page without sidebar)
      window.open(`/canvas/${docRef.id}`, '_blank');
      
      // Reset form and close modal
      setFloorFormData({
        name: '',
        description: ''
      });
      setShowCreateModal(false);
      setCanvasData({ items: [] });
    } catch (error) {
      console.error('Error creating floor:', error);
      alert('Failed to create floor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening existing floor in new page
  const handleOpenFloor = (floorId) => {
    const floor = floors.find(f => f.id === floorId);
    if (!floor) return;
    
    // Open in new page (blank page without sidebar)
    window.open(`/canvas/${floorId}`, '_blank');
  };

  // Handle tab close
  const handleCloseTab = (tabId, e) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    if (activeTab === tabId) {
      setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
    }
  };

  // Handle canvas click to add item (called when shape drawing completes)
  const handleCanvasClick = ({ x, y, shape, item }) => {
    if (!activeTab) return;
    
    if (item) {
      // Text item created immediately
      const updatedItems = [...(canvasData.items || []), item];
      setCanvasData({ ...canvasData, items: updatedItems });
      return;
    }
    
    if (shape) {
      // Shape drawing completed
      const newItem = {
        id: Date.now().toString(),
        ...shape,
        label: shape.type === 'text' ? shape.text : `Item ${(canvasData.items?.length || 0) + 1}`
      };
      const updatedItems = [...(canvasData.items || []), newItem];
      setCanvasData({ ...canvasData, items: updatedItems });
      return;
    }
    
    // Legacy support for simple click (fallback)
    if (activeTool && x !== undefined && y !== undefined) {
      const newItem = {
        id: Date.now().toString(),
        x: Math.round(x),
        y: Math.round(y),
        width: 60,
        height: 40,
        label: activeTool === 'text' ? 'Text' : `Item ${(canvasData.items?.length || 0) + 1}`,
        type: activeTool,
        fillColor: '#3b82f6',
        strokeColor: '#2563eb'
      };
      
      const updatedItems = [...(canvasData.items || []), newItem];
      setCanvasData({ ...canvasData, items: updatedItems });
    }
  };

  // Handle canvas update (save to Firebase)
  const handleCanvasUpdate = async (data) => {
    if (!activeTab || !data.floorName) return;
    
    try {
      const floorRef = doc(db, 'floors', activeTab);
      await updateDoc(floorRef, {
        canvasData: data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving canvas:', error);
    }
  };

  // Handle item selection
  const handleItemSelect = (itemId) => {
    if (!itemId) {
      setSelectedItem(null);
      return;
    }
    const item = canvasData.items?.find(i => i.id === itemId);
    setSelectedItem(item || null);
    setIsDrawing(false);
    setActiveTool(null);
  };

  // Handle item update from ToolRibbon
  const handleItemUpdate = (itemId, updates) => {
    const updatedItems = (canvasData.items || []).map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    setCanvasData({ ...canvasData, items: updatedItems });
  };

  // Handle item duplication
  const handleItemDuplicate = (itemId) => {
    const item = canvasData.items?.find(i => i.id === itemId);
    if (!item) return;
    
    const duplicatedItem = {
      ...item,
      id: Date.now().toString(),
      x: item.x + 20,
      y: item.y + 20
    };
    
    const updatedItems = [...(canvasData.items || []), duplicatedItem];
    setCanvasData({ ...canvasData, items: updatedItems });
    
    // Select the duplicated item
    setSelectedItem({ id: duplicatedItem.id, ...duplicatedItem });
  };

  // Handle item lock/unlock
  const handleItemLock = (itemId) => {
    const item = canvasData.items?.find(i => i.id === itemId);
    if (!item) return;
    
    handleItemUpdate(itemId, { locked: !item.locked });
  };

  // Handle item deletion
  const handleDeleteItem = async (itemId) => {
    if (!activeTab) return;
    
    const updatedItems = (canvasData.items || []).filter(item => item.id !== itemId);
    const updatedCanvasData = { ...canvasData, items: updatedItems };
    setCanvasData(updatedCanvasData);
    
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }

    // Save to Firebase
    try {
      const floorRef = doc(db, 'floors', activeTab);
      await updateDoc(floorRef, {
        canvasData: updatedCanvasData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const currentFloor = floors.find(f => f.id === activeTab);

  return (
    <div className="w-full">
      {/* Tabs Bar */}
      {tabs.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 border-b-2 border-gray-200">
            <div className="flex items-center gap-2 overflow-x-auto">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 cursor-pointer border-b-[3px] -mb-0.5 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-slate-800 border-teal-600 bg-teal-50'
                      : 'text-gray-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-medium">{tab.name}</span>
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="ml-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Close tab"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm whitespace-nowrap flex items-center gap-2"
            >
              <span>+</span>
              <span>Add Floor Plan</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      {!activeTab ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl shadow-lg shadow-slate-800/5 border border-gray-200">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No Floor Plan Open</h3>
          <p className="text-gray-500 mb-6">Create a new floor plan to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            Create New Floor Plan
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Tool Ribbon */}
          <ToolRibbon
            selectedItem={selectedItem}
            onToolSelect={setActiveTool}
            onItemUpdate={handleItemUpdate}
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            showGridlines={showGridlines}
            setShowGridlines={setShowGridlines}
            showRulers={showRulers}
            setShowRulers={setShowRulers}
            editingText={editingText}
            canvasData={canvasData}
          />

          {/* Canvas Area */}
          <div className="bg-white rounded-xl shadow-lg shadow-slate-800/5 border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">
                    {currentFloor?.name || 'Floor Plan'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentFloor?.description || 'Edit your floor plan'}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  <p>Hold Ctrl + Scroll to zoom • Hold Ctrl + Drag to pan • Click to {activeTool ? 'place items' : 'select'} • Right-click for options</p>
                </div>
              </div>
              
              {/* Zoom Control */}
              <ZoomControl 
                zoom={zoom} 
                setZoom={setZoom}
                onReset={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
              />
            </div>

            {/* Canvas Component */}
            <Canvas
              floorName={currentFloor?.name || ''}
              canvasData={canvasData}
              onCanvasUpdate={handleCanvasUpdate}
              isDrawing={!!activeTool}
              activeTool={activeTool}
              onCanvasClick={handleCanvasClick}
              selectedItem={selectedItem?.id}
              onItemSelect={handleItemSelect}
              onItemDelete={handleDeleteItem}
              onItemUpdate={handleItemUpdate}
              onItemDuplicate={handleItemDuplicate}
              onItemLock={handleItemLock}
              onItemLayerChange={async (itemId, direction) => {
                // Handle layer changes (put to back/front)
                const items = [...(canvasData.items || [])];
                const index = items.findIndex(i => i.id === itemId);
                if (index === -1) return;
                
                const item = items.splice(index, 1)[0];
                if (direction === 'back') {
                  items.unshift(item);
                } else {
                  items.push(item);
                }
                
                const updatedCanvasData = { ...canvasData, items };
                setCanvasData(updatedCanvasData);
                
                // Save to Firebase
                if (activeTab) {
                  try {
                    const floorRef = doc(db, 'floors', activeTab);
                    await updateDoc(floorRef, {
                      canvasData: updatedCanvasData,
                      updatedAt: new Date().toISOString()
                    });
                  } catch (error) {
                    console.error('Error updating layer:', error);
                  }
                }
              }}
              showGridlines={showGridlines}
              showRulers={showRulers}
              zoom={zoom}
              setZoom={setZoom}
              pan={pan}
              setPan={setPan}
              zoomToolActive={zoomToolActive}
              setZoomToolActive={setZoomToolActive}
              editingText={editingText}
              setEditingText={setEditingText}
            />
          </div>
        </div>
      )}

      {/* Create Floor Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-slate-800/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease]"
          onClick={() => {
            setShowCreateModal(false);
            setFloorFormData({
              name: '',
              description: ''
            });
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-100">
                <h2 className="text-2xl font-bold text-slate-800">Create New Floor Plan</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFloorFormData({
                      name: '',
                      description: ''
                    });
                  }}
                  className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-xl hover:bg-gray-200 hover:text-slate-800 transition-all"
                >
                  ×
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateFloor(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Floor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={floorFormData.name}
                      onChange={(e) => setFloorFormData({ ...floorFormData, name: e.target.value })}
                      placeholder="e.g., Ground Floor, First Floor"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={floorFormData.description}
                      onChange={(e) => setFloorFormData({ ...floorFormData, description: e.target.value })}
                      placeholder="Enter floor description..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? 'Creating...' : 'Create Floor Plan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFloorFormData({
                        name: '',
                        description: ''
                      });
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
