'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import Canvas from '@/app/admin/dedicated-desk/edit-floor/Canvas/Canvas';
import ToolRibbon from '@/app/admin/dedicated-desk/edit-floor/ToolRibbon/ToolRibbon';
import ZoomControl from '@/app/admin/dedicated-desk/edit-floor/ZoomControl/ZoomControl';

export default function CanvasEditor() {
  const params = useParams();
  const router = useRouter();
  const floorId = params.id;
  
  const [floor, setFloor] = useState(null);
  const [canvasData, setCanvasData] = useState({ items: [] });
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [showGridlines, setShowGridlines] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoomToolActive, setZoomToolActive] = useState(false);
  const [editingText, setEditingText] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch floor data from Firebase
  useEffect(() => {
    if (!floorId) return;

    const unsubscribe = onSnapshot(doc(db, 'floors', floorId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const floorData = { id: docSnapshot.id, ...docSnapshot.data() };
        setFloor(floorData);
        setCanvasData(floorData.canvasData || { items: [] });
        setLoading(false);
      } else {
        setLoading(false);
        alert('Floor plan not found');
        router.push('/admin/dedicated-desk');
      }
    });

    return () => unsubscribe();
  }, [floorId, router]);

  // Handle canvas click to add item (called when shape drawing completes)
  const handleCanvasClick = ({ x, y, shape, item }) => {
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
    
    // Legacy support for simple click
    if (activeTool && activeTool !== 'brush' && x !== undefined && y !== undefined) {
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
    if (!floorId || !data.floorName) return;
    
    try {
      const floorRef = doc(db, 'floors', floorId);
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
    if (!floorId) return;
    
    const updatedItems = (canvasData.items || []).filter(item => item.id !== itemId);
    const updatedCanvasData = { ...canvasData, items: updatedItems };
    setCanvasData(updatedCanvasData);
    
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }

    // Save to Firebase
    try {
      const floorRef = doc(db, 'floors', floorId);
      await updateDoc(floorRef, {
        canvasData: updatedCanvasData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  // Handle layer changes
  const handleLayerChange = async (itemId, direction) => {
    if (!floorId) return;
    
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
    try {
      const floorRef = doc(db, 'floors', floorId);
      await updateDoc(floorRef, {
        canvasData: updatedCanvasData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating layer:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-4xl mb-4">🏢</div>
          <p className="text-gray-600">Loading floor plan...</p>
        </div>
      </div>
    );
  }

  if (!floor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600 mb-4">Floor plan not found</p>
          <button
            onClick={() => router.push('/admin/dedicated-desk')}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky Tool Ribbon */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6">
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
        </div>
      </div>

      {/* Canvas Area - Takes remaining space */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-lg shadow-slate-800/5 border border-gray-200 p-4 sm:p-6 h-full">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  {floor.name || 'Floor Plan'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {floor.description || 'Edit your floor plan'}
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
            floorName={floor.name || ''}
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
            onItemLayerChange={handleLayerChange}
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
    </div>
  );
}

