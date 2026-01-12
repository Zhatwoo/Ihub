'use client';

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';

export default function Canvas({ 
  floorName, 
  canvasData, 
  onCanvasUpdate,
  isDrawing = false,
  activeTool = null,
  onCanvasClick,
  selectedItem = null,
  onItemSelect = null,
  onItemDelete = null,
  onItemLayerChange = null,
  onItemUpdate = null,
  onItemDuplicate = null,
  onItemLock = null,
  showGridlines = true,
  showRulers = false,
  zoom: externalZoom,
  setZoom: setExternalZoom,
  pan: externalPan,
  setPan: setExternalPan,
  zoomToolActive = false,
  setZoomToolActive = null,
  editingText = undefined,
  setEditingText = null
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [internalZoom, setInternalZoom] = useState(1);
  const [internalPan, setInternalPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [baseCanvasSize] = useState({ width: 1200, height: 800 });
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, itemId: null });
  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentShape, setCurrentShape] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizeStart, setResizeStart] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const [internalEditingText, setInternalEditingText] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [hoveredHandle, setHoveredHandle] = useState(null);

  // Use external editingText if provided, otherwise use internal state
  const currentEditingText = editingText !== undefined ? editingText : internalEditingText;
  const setCurrentEditingText = setEditingText || setInternalEditingText;

  // Use external zoom/pan if provided, otherwise use internal state
  const zoom = externalZoom !== undefined ? externalZoom : internalZoom;
  const pan = externalPan !== undefined ? externalPan : internalPan;
  const setZoom = setExternalZoom || setInternalZoom;
  const setPan = setExternalPan || setInternalPan;
  
  // Calculate dynamic canvas size based on zoom (increase when zooming out, but limit growth)
  const canvasSize = useMemo(() => {
    const minZoom = 0.1;
    // Limit scale factor to prevent excessive canvas size at high zoom levels
    const maxScaleFactor = 2; // Don't grow more than 2x
    const scaleFactor = Math.min(maxScaleFactor, Math.max(1, 1 / zoom));
    return {
      width: baseCanvasSize.width * scaleFactor,
      height: baseCanvasSize.height * scaleFactor
    };
  }, [baseCanvasSize, zoom]);

  // Zoom limits
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.1;

  // Handle mouse wheel zoom (only when Ctrl is held)
  const handleWheel = useCallback((e) => {
    // Only zoom if Ctrl key is held
    if (!e.ctrlKey || zoomToolActive) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom(prevZoom => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prevZoom + delta));
      return newZoom;
    });
  }, [zoomToolActive, setZoom]);

  // Get canvas coordinates from mouse event
  const getCanvasCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return { x: 0, y: 0 };
    
    const canvasRect = canvas.getBoundingClientRect();
    const scrollLeft = container.scrollLeft || 0;
    const scrollTop = container.scrollTop || 0;
    
    return {
      x: (e.clientX - canvasRect.left + scrollLeft - pan.x) / zoom,
      y: (e.clientY - canvasRect.top + scrollTop - pan.y) / zoom
    };
  }, [pan, zoom]);

  // Get transform handles for an item
  const getTransformHandles = useCallback((item) => {
    // For lines, return endpoint handles
    if (item.type === 'line' && item.x2 !== undefined) {
      return {
        resize: [
          { type: 'start', x: item.x, y: item.y },
          { type: 'end', x: item.x2, y: item.y2 }
        ],
        rotate: null
      };
    }
    
    // Calculate bounding box for all shapes
    let minX, minY, maxX, maxY, cx, cy;
    
    if (item.type === 'circle' && item.radius) {
      minX = item.x - item.radius;
      minY = item.y - item.radius;
      maxX = item.x + item.radius;
      maxY = item.y + item.radius;
      cx = item.x;
      cy = item.y;
    } else {
      // For rectangles, text, and other shapes
      const w = item.width || 60;
      const h = item.height || 40;
      minX = item.x;
      minY = item.y;
      maxX = item.x + w;
      maxY = item.y + h;
      cx = item.x + w / 2;
      cy = item.y + h / 2;
    }
    
    const w = maxX - minX;
    const h = maxY - minY;
    const rotation = (item.rotation || 0) * Math.PI / 180;
    
    // Helper function to rotate a point around center
    const rotatePoint = (px, py) => {
      const dx = px - cx;
      const dy = py - cy;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos
      };
    };
    
    // Base handle positions (before rotation) - always use bounding box
    const baseHandles = {
      resize: [
        { type: 'nw', x: minX, y: minY },
        { type: 'ne', x: maxX, y: minY },
        { type: 'sw', x: minX, y: maxY },
        { type: 'se', x: maxX, y: maxY },
        { type: 'n', x: cx, y: minY },
        { type: 's', x: cx, y: maxY },
        { type: 'w', x: minX, y: cy },
        { type: 'e', x: maxX, y: cy }
      ],
      rotate: { x: cx, y: minY - 30 }
    };
    
    // Rotate all handles
    return {
      resize: baseHandles.resize.map(handle => rotatePoint(handle.x, handle.y)),
      rotate: rotatePoint(baseHandles.rotate.x, baseHandles.rotate.y)
    };
  }, []);

  // Handle pan start
  const handleMouseDown = useCallback((e) => {
    // Don't pan if drawing, resizing, or rotating
    if (isDrawingShape || isResizing || isRotating) return;
    
    // Handle zoom tool
    if (zoomToolActive && e.button === 0) {
      const coords = getCanvasCoords(e);
      // Zoom in at clicked position
      const newZoom = Math.min(MAX_ZOOM, zoom * 1.2);
      
      // Adjust pan to zoom towards click point
      const newPanX = coords.x * zoom - coords.x * newZoom + pan.x;
      const newPanY = coords.y * zoom - coords.y * newZoom + pan.y;
      
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
      e.preventDefault();
      return;
    }
    
    if (e.button === 1 || (e.button === 0 && e.ctrlKey && !activeTool && !zoomToolActive)) { // Middle mouse or Ctrl+Left (when not using tool)
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
      e.preventDefault();
      return;
    }

    // Handle shape drawing
    if (activeTool && e.button === 0 && !zoomToolActive) {
      const coords = getCanvasCoords(e);
      setIsDrawingShape(true);
      setDrawStart(coords);
      
      if (activeTool === 'text') {
        // Create text item immediately
        const newItem = {
          id: Date.now().toString(),
          x: coords.x,
          y: coords.y,
          width: 100,
          height: 30,
          type: 'text',
          text: 'Text',
          fillColor: '#000000',
          strokeColor: 'transparent',
          fontSize: 16
        };
        setCurrentShape(newItem);
        if (onCanvasClick) {
          onCanvasClick({ x: coords.x, y: coords.y, item: newItem });
        }
        setCurrentEditingText(newItem.id);
      } else if (activeTool === 'line') {
        setCurrentShape({
          type: 'line',
          x: coords.x,
          y: coords.y,
          x2: coords.x,
          y2: coords.y,
          fillColor: 'transparent',
          strokeColor: '#2563eb',
          strokeWidth: 2
        });
      } else if (activeTool === 'circle') {
        setCurrentShape({
          type: 'circle',
          x: coords.x,
          y: coords.y,
          radius: 0,
          fillColor: '#3b82f6',
          strokeColor: '#2563eb'
        });
      } else {
        setCurrentShape({
          type: activeTool,
          x: coords.x,
          y: coords.y,
          width: 0,
          height: 0,
          fillColor: '#3b82f6',
          strokeColor: '#2563eb'
        });
      }
      e.preventDefault();
    }

    // Handle transform handles and dragging
    if (selectedItem && !activeTool && e.button === 0 && !zoomToolActive) {
      const coords = getCanvasCoords(e);
      const item = canvasData.items?.find(i => i.id === selectedItem);
      if (!item || item.locked) return; // Don't allow interaction with locked items

      const handleSize = 8 / zoom;
      const handles = getTransformHandles(item);
      
      // Check if clicking on resize handle
      // For lines, handles have type property
      if (item.type === 'line' && item.x2 !== undefined) {
        for (const handle of handles.resize) {
          const dist = Math.sqrt(Math.pow(coords.x - handle.x, 2) + Math.pow(coords.y - handle.y, 2));
          if (dist < handleSize) {
            setIsResizing(true);
            setResizeHandle(handle.type);
            setResizeStart({ ...coords, item: { ...item } });
            e.preventDefault();
            return;
          }
        }
      } else {
        // For other shapes, map back to handle types
        const handleTypes = ['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'];
        for (let i = 0; i < handles.resize.length; i++) {
          const handle = handles.resize[i];
          const dist = Math.sqrt(Math.pow(coords.x - handle.x, 2) + Math.pow(coords.y - handle.y, 2));
          if (dist < handleSize) {
            setIsResizing(true);
            setResizeHandle(handleTypes[i]);
            setResizeStart({ ...coords, item: { ...item } });
            e.preventDefault();
            return;
          }
        }
      }

      // Check if clicking on rotate handle
      if (handles.rotate) {
        const dist = Math.sqrt(Math.pow(coords.x - handles.rotate.x, 2) + Math.pow(coords.y - handles.rotate.y, 2));
        if (dist < handleSize) {
          setIsRotating(true);
          setResizeStart({ ...coords, item: { ...item } });
          e.preventDefault();
          return;
        }
      }

      // Check if clicking on the item itself (for dragging)
      let isOnItem = false;
      if (item.type === 'line' && item.x2 !== undefined) {
        const dist = distanceToLine(coords.x, coords.y, item.x, item.y, item.x2, item.y2);
        isOnItem = dist < 10 / zoom;
      } else if (item.type === 'circle' && item.radius) {
        const dist = Math.sqrt(Math.pow(coords.x - item.x, 2) + Math.pow(coords.y - item.y, 2));
        isOnItem = dist <= item.radius;
      } else {
        isOnItem = coords.x >= item.x && coords.x <= item.x + (item.width || 60) &&
                    coords.y >= item.y && coords.y <= item.y + (item.height || 40);
      }
      
      if (isOnItem) {
        setIsDragging(true);
        setDragStart({ x: coords.x, y: coords.y, item: { ...item } });
        e.preventDefault();
        return;
      }
    }
  }, [pan, activeTool, isDrawingShape, isResizing, isRotating, isDragging, zoomToolActive, selectedItem, canvasData, getCanvasCoords, getTransformHandles, onCanvasClick, zoom, setZoom, setPan]);

  // Handle pan move
  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    // Track hover over handles for cursor changes
    if (!isPanning && !isResizing && !isRotating && !isDragging && !isDrawingShape && selectedItem) {
      const coords = getCanvasCoords(e);
      const item = canvasData.items?.find(i => i.id === selectedItem);
      if (item && !item.locked) {
        const handleSize = 8 / zoom;
        const handles = getTransformHandles(item);
        let foundHandle = null;
        
        // Check resize handles
        // For lines, handles have type property
        if (item.type === 'line' && item.x2 !== undefined) {
          for (const handle of handles.resize) {
            const dist = Math.sqrt(Math.pow(coords.x - handle.x, 2) + Math.pow(coords.y - handle.y, 2));
            if (dist < handleSize) {
              foundHandle = 'resize';
              break;
            }
          }
        } else {
          for (let i = 0; i < handles.resize.length; i++) {
            const handle = handles.resize[i];
            const dist = Math.sqrt(Math.pow(coords.x - handle.x, 2) + Math.pow(coords.y - handle.y, 2));
            if (dist < handleSize) {
              foundHandle = 'resize';
              break;
            }
          }
        }
        
        // Check rotate handle
        if (!foundHandle && handles.rotate) {
          const dist = Math.sqrt(Math.pow(coords.x - handles.rotate.x, 2) + Math.pow(coords.y - handles.rotate.y, 2));
          if (dist < handleSize) {
            foundHandle = 'rotate';
          }
        }
        
        setHoveredHandle(foundHandle);
      } else {
        setHoveredHandle(null);
      }
    }

    // Handle resizing
    if (isResizing && resizeHandle && resizeStart && selectedItem && onItemUpdate) {
      const coords = getCanvasCoords(e);
      const item = canvasData.items?.find(i => i.id === selectedItem);
      if (!item || item.locked) return;

      const deltaX = coords.x - resizeStart.x;
      const deltaY = coords.y - resizeStart.y;
      
      let updates = {};
      const handle = resizeHandle;
      
      // Handle line resizing (endpoints)
      if (item.type === 'line' && item.x2 !== undefined) {
        if (handle === 'start') {
          updates.x = resizeStart.item.x + deltaX;
          updates.y = resizeStart.item.y + deltaY;
        } else if (handle === 'end') {
          updates.x2 = resizeStart.item.x2 + deltaX;
          updates.y2 = resizeStart.item.y2 + deltaY;
        }
      } else if (item.type === 'circle' && item.radius) {
        // Handle circle resizing
        const scaleX = handle.includes('e') ? 1 + deltaX / resizeStart.item.radius : 
                      handle.includes('w') ? 1 - deltaX / resizeStart.item.radius : 1;
        const scaleY = handle.includes('s') ? 1 + deltaY / resizeStart.item.radius : 
                      handle.includes('n') ? 1 - deltaY / resizeStart.item.radius : 1;
        const scale = Math.max(0.1, Math.min(scaleX, scaleY));
        updates.radius = Math.max(5, resizeStart.item.radius * scale);
      } else {
        // Handle shape resizing (rectangles, polygons, etc.)
        if (handle.includes('e')) updates.width = Math.max(10, resizeStart.item.width + deltaX);
        if (handle.includes('w')) {
          updates.width = Math.max(10, resizeStart.item.width - deltaX);
          updates.x = resizeStart.item.x + deltaX;
        }
        if (handle.includes('s')) updates.height = Math.max(10, resizeStart.item.height + deltaY);
        if (handle.includes('n')) {
          updates.height = Math.max(10, resizeStart.item.height - deltaY);
          updates.y = resizeStart.item.y + deltaY;
        }
      }

      onItemUpdate(selectedItem, updates);
      return;
    }

    // Handle rotating
    if (isRotating && resizeStart && selectedItem && onItemUpdate) {
      const coords = getCanvasCoords(e);
      const item = canvasData.items?.find(i => i.id === selectedItem);
      if (!item || item.locked) return;

      // Calculate center point based on shape type - use original item position
      let cx, cy;
      if (resizeStart.item.type === 'circle' && resizeStart.item.radius) {
        cx = resizeStart.item.x;
        cy = resizeStart.item.y;
      } else {
        cx = resizeStart.item.x + (resizeStart.item.width || 60) / 2;
        cy = resizeStart.item.y + (resizeStart.item.height || 40) / 2;
      }
      
      // Use the original rotation from when rotation started
      const originalRotation = resizeStart.item.rotation || 0;
      
      // Calculate angle from center to original mouse position
      const angle1 = Math.atan2(resizeStart.y - cy, resizeStart.x - cx);
      // Calculate angle from center to current mouse position
      const angle2 = Math.atan2(coords.y - cy, coords.x - cx);
      
      // Calculate rotation delta
      let rotationDelta = (angle2 - angle1) * 180 / Math.PI;
      
      // Normalize rotation delta to prevent accumulation errors
      if (rotationDelta > 180) rotationDelta -= 360;
      if (rotationDelta < -180) rotationDelta += 360;
      
      // Apply rotation delta to original rotation
      const newRotation = originalRotation + rotationDelta;
      
      onItemUpdate(selectedItem, { rotation: newRotation });
      
      // Update resizeStart to track current position but keep original item state
      setResizeStart({ 
        ...resizeStart, 
        y: coords.y, 
        x: coords.x,
        item: { ...resizeStart.item, rotation: newRotation }
      });
      e.preventDefault();
      return;
    }

    // Handle dragging selected item
    if (isDragging && dragStart && selectedItem && onItemUpdate) {
      const coords = getCanvasCoords(e);
      const deltaX = coords.x - dragStart.x;
      const deltaY = coords.y - dragStart.y;
      
      const item = canvasData.items?.find(i => i.id === selectedItem);
      if (item && !item.locked) {
        // Calculate new position based on original drag start position
        const newX = dragStart.item.x + deltaX;
        const newY = dragStart.item.y + deltaY;
        
        // Update position without changing selection
        onItemUpdate(selectedItem, {
          x: newX,
          y: newY
        });
        
        // Update dragStart to track current mouse position (in canvas coords)
        setDragStart({ 
          x: coords.x, 
          y: coords.y, 
          item: { ...dragStart.item, x: newX, y: newY }
        });
      }
      e.preventDefault();
      return;
    }

    // Handle shape drawing
    if (isDrawingShape && currentShape && drawStart) {
      const coords = getCanvasCoords(e);
      
      if (currentShape.type === 'line') {
        setCurrentShape({
          ...currentShape,
          x2: coords.x,
          y2: coords.y
        });
      } else if (currentShape.type === 'rectangle') {
        const width = coords.x - drawStart.x;
        const height = coords.y - drawStart.y;
        setCurrentShape({
          ...currentShape,
          x: Math.min(drawStart.x, coords.x),
          y: Math.min(drawStart.y, coords.y),
          width: Math.abs(width),
          height: Math.abs(height)
        });
      } else if (currentShape.type === 'circle') {
        const radius = Math.sqrt(
          Math.pow(coords.x - drawStart.x, 2) + 
          Math.pow(coords.y - drawStart.y, 2)
        );
        setCurrentShape({
          ...currentShape,
          radius: radius
        });
      }
      return;
    }
  }, [isPanning, panStart, isResizing, resizeHandle, resizeStart, isRotating, isDragging, dragStart, selectedItem, isDrawingShape, currentShape, drawStart, canvasData, getCanvasCoords, onItemUpdate, setPan, getTransformHandles, zoom]);

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      return;
    }

    if (isDrawingShape && currentShape) {
      // Finalize shape
      if (onCanvasClick && currentShape.type !== 'text') {
        // Ensure shape has valid dimensions before saving
        if (currentShape.type === 'line' && currentShape.x2 !== undefined && currentShape.y2 !== undefined) {
          onCanvasClick({ shape: currentShape });
        } else if (currentShape.type === 'circle' && currentShape.radius > 0) {
          onCanvasClick({ shape: currentShape });
        } else if (currentShape.type === 'rectangle' && currentShape.width > 0 && currentShape.height > 0) {
          onCanvasClick({ shape: currentShape });
        }
      }
      setIsDrawingShape(false);
      setCurrentShape(null);
      setDrawStart(null);
      return;
    }

    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStart(null);
      return;
    }

    if (isRotating) {
      setIsRotating(false);
      setResizeStart(null);
      return;
    }
  }, [isPanning, isDragging, isDrawingShape, currentShape, isResizing, isRotating, onCanvasClick]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    const scrollLeft = container.scrollLeft || 0;
    const scrollTop = container.scrollTop || 0;
    
    // Calculate click position
    const x = (e.clientX - canvasRect.left + scrollLeft - pan.x) / zoom;
    const y = (e.clientY - canvasRect.top + scrollTop - pan.y) / zoom;
    
    // Check if right-click is on an item
    if (canvasData?.items) {
      const clickedItem = canvasData.items.find(item => {
        if (item.type === 'line' && item.x2 !== undefined) {
          const dist = distanceToLine(x, y, item.x, item.y, item.x2, item.y2);
          return dist < 10 / zoom;
        } else if (item.type === 'circle' && item.radius) {
          const dist = Math.sqrt(Math.pow(x - item.x, 2) + Math.pow(y - item.y, 2));
          return dist <= item.radius;
        } else {
          return x >= item.x && x <= item.x + (item.width || 60) &&
                 y >= item.y && y <= item.y + (item.height || 40);
        }
      });
      
      if (clickedItem) {
        setContextMenu({
          show: true,
          x: e.clientX,
          y: e.clientY,
          itemId: clickedItem.id
        });
        return;
      }
    }
    
    // Close context menu if clicking empty space
    setContextMenu({ show: false, x: 0, y: 0, itemId: null });
  }, [pan, zoom, canvasData]);

  // Handle context menu actions
  const handleContextMenuAction = useCallback((action) => {
    if (!contextMenu.itemId) return;
    
    switch (action) {
      case 'duplicate':
        if (onItemDuplicate) {
          onItemDuplicate(contextMenu.itemId);
        }
        break;
      case 'lock':
        if (onItemLock) {
          onItemLock(contextMenu.itemId);
        }
        break;
      case 'delete':
        if (onItemDelete) {
          onItemDelete(contextMenu.itemId);
        }
        break;
      case 'putToBack':
        if (onItemLayerChange) {
          onItemLayerChange(contextMenu.itemId, 'back');
        }
        break;
      case 'putToFront':
        if (onItemLayerChange) {
          onItemLayerChange(contextMenu.itemId, 'front');
        }
        break;
      case 'group':
        // Group functionality can be implemented later
        console.log('Group functionality not yet implemented');
        break;
    }
    
    setContextMenu({ show: false, x: 0, y: 0, itemId: null });
  }, [contextMenu, onItemDelete, onItemLayerChange, onItemDuplicate, onItemLock]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ show: false, x: 0, y: 0, itemId: null });
    };
    
    if (contextMenu.show) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.show]);

  // Helper function to calculate distance to line
  const distanceToLine = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle double-click for text editing
  const handleDoubleClick = useCallback((e) => {
    const coords = getCanvasCoords(e);
    
    // Check if double-clicking on an item
    if (canvasData?.items) {
      const clickedItem = canvasData.items.find(item => {
        if (item.type === 'line' && item.x2 !== undefined) {
          const dist = distanceToLine(coords.x, coords.y, item.x, item.y, item.x2, item.y2);
          return dist < 10 / zoom;
        } else if (item.type === 'circle' && item.radius) {
          const dist = Math.sqrt(Math.pow(coords.x - item.x, 2) + Math.pow(coords.y - item.y, 2));
          return dist <= item.radius;
        } else {
          return coords.x >= item.x && coords.x <= item.x + (item.width || 60) &&
                 coords.y >= item.y && coords.y <= item.y + (item.height || 40);
        }
      });
      
      if (clickedItem) {
        // If item doesn't have text, add text property
        if (!clickedItem.text && !clickedItem.label) {
          if (onItemUpdate) {
            onItemUpdate(clickedItem.id, { text: '', label: '' });
          }
        }
        setCurrentEditingText(clickedItem.id);
        if (onItemSelect) {
          onItemSelect(clickedItem.id);
        }
      }
    }
  }, [canvasData, getCanvasCoords, zoom, onItemUpdate, onItemSelect]);

  // Handle canvas click (adjusted for zoom and pan)
  const handleCanvasClick = useCallback((e) => {
    if (isPanning || isDrawingShape || isResizing || isRotating || isDragging) return;
    
    const coords = getCanvasCoords(e);
    const { x, y } = coords;
    
    // Check if click is on transform handle (handled in mousedown)
    // Check if click is on an existing item
    if (canvasData?.items && onItemSelect) {
      const clickedItem = canvasData.items.find(item => {
        if (item.type === 'line' && item.x2 !== undefined) {
          // Check if click is near line
          const dist = distanceToLine(x, y, item.x, item.y, item.x2, item.y2);
          return dist < 5 / zoom;
        } else if (item.type === 'circle' && item.radius) {
          const dist = Math.sqrt(Math.pow(x - item.x, 2) + Math.pow(y - item.y, 2));
          return dist <= item.radius;
        } else {
          return x >= item.x && x <= item.x + (item.width || 60) &&
                 y >= item.y && y <= item.y + (item.height || 40);
        }
      });
      
      if (clickedItem) {
        onItemSelect(clickedItem.id);
        return;
      }
    }
    
    // If no item clicked and drawing mode is active, add new item
    if (onCanvasClick && x >= 0 && x <= canvasSize.width && y >= 0 && y <= canvasSize.height) {
      if (activeTool) {
        // Shape creation is handled in mousedown
        return;
      }
      onCanvasClick({ x, y });
    } else if (onItemSelect) {
      // Deselect if clicking empty space
      onItemSelect(null);
    }
  }, [isPanning, isDrawingShape, isResizing, isRotating, isDragging, activeTool, getCanvasCoords, onCanvasClick, canvasSize, canvasData, onItemSelect, zoom]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw grid (only if showGridlines is true)
    if (showGridlines) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1 / zoom;
      // Grid size scales with zoom to maintain visual consistency
      const baseGridSize = 20;
      
      // Calculate visible grid area
      const startX = Math.floor(-pan.x / zoom / baseGridSize) * baseGridSize;
      const startY = Math.floor(-pan.y / zoom / baseGridSize) * baseGridSize;
      const endX = Math.ceil((canvas.width - pan.x) / zoom / baseGridSize) * baseGridSize;
      const endY = Math.ceil((canvas.height - pan.y) / zoom / baseGridSize) * baseGridSize;
      
      for (let x = startX; x <= endX; x += baseGridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize.height);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y += baseGridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize.width, y);
        ctx.stroke();
      }
    }
    
    // Draw rulers (if enabled)
    if (showRulers) {
      ctx.save();
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#6b7280';
      
      // Rulers in corner (top-left corner) - fixed size regardless of zoom
      const rulerHeight = 20;
      const rulerWidth = 20;
      
      // Corner square (intersection)
      ctx.fillRect(-rulerWidth, -rulerHeight, rulerWidth, rulerHeight);
      ctx.strokeRect(-rulerWidth, -rulerHeight, rulerWidth, rulerHeight);
      
      // Horizontal ruler (top, starting from corner)
      ctx.fillRect(0, -rulerHeight, canvasSize.width, rulerHeight);
      ctx.strokeRect(0, -rulerHeight, canvasSize.width, rulerHeight);
      
      // Vertical ruler (left, starting from corner)
      ctx.fillRect(-rulerWidth, 0, rulerWidth, canvasSize.height);
      ctx.strokeRect(-rulerWidth, 0, rulerWidth, canvasSize.height);
      
      // Ruler markings
      const markInterval = 50;
      for (let x = 0; x <= canvasSize.width; x += markInterval) {
        ctx.beginPath();
        ctx.moveTo(x, -rulerHeight);
        ctx.lineTo(x, -rulerHeight + 5);
        ctx.stroke();
        ctx.fillText(x.toString(), x + 2, -rulerHeight + 12);
      }
      for (let y = 0; y <= canvasSize.height; y += markInterval) {
        ctx.beginPath();
        ctx.moveTo(-rulerWidth, y);
        ctx.lineTo(-rulerWidth + 5, y);
        ctx.stroke();
        ctx.save();
        ctx.translate(-rulerWidth + 12, y);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(y.toString(), 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    // Draw canvas data (items)
    if (canvasData && canvasData.items) {
      canvasData.items.forEach(item => {
        const isSelected = selectedItem === item.id;
        const fillColor = item.fillColor || (isSelected ? '#10b981' : '#3b82f6');
        const strokeColor = item.strokeColor || (isSelected ? '#059669' : '#2563eb');
        
        ctx.save();
        
        // Apply rotation if exists
        if (item.rotation) {
          const cx = item.x + (item.width || 60) / 2;
          const cy = item.y + (item.height || 40) / 2;
          ctx.translate(cx, cy);
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.translate(-cx, -cy);
        }
        
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = (isSelected ? 3 : 2) / zoom;
        
        // Draw based on shape type
        if (item.type === 'line' && item.x2 !== undefined && item.y2 !== undefined) {
          ctx.beginPath();
          ctx.moveTo(item.x, item.y);
          ctx.lineTo(item.x2, item.y2);
          ctx.stroke();
          // Draw text if exists
          if (item.text || item.label) {
            const midX = (item.x + item.x2) / 2;
            const midY = (item.y + item.y2) / 2;
            ctx.fillStyle = item.textColor || item.fillColor || '#000000';
            ctx.font = `${item.fontSize || 12}px ${item.fontFamily || 'Arial'}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.text || item.label, midX, midY);
          }
        } else if (item.type === 'circle' && item.radius) {
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Draw text if exists
          if (item.text || item.label) {
            ctx.fillStyle = item.textColor || item.fillColor || '#000000';
            ctx.font = `${item.fontSize || 12}px ${item.fontFamily || 'Arial'}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.text || item.label, item.x, item.y);
          }
        } else if (item.type === 'text') {
          const text = item.text || item.label || 'Text';
          const itemWidth = item.width || 100;
          const itemHeight = item.height || 30;
          
          // Draw text background/outline if needed (draw first, then text on top)
          if (item.fillColor && item.fillColor !== 'transparent' && item.fillColor !== item.textColor) {
            ctx.fillStyle = item.fillColor;
            ctx.fillRect(item.x, item.y, itemWidth, itemHeight);
          }
          
          // Draw outline if specified
          if (item.strokeColor && item.strokeColor !== 'transparent') {
            ctx.strokeStyle = item.strokeColor;
            ctx.lineWidth = (item.strokeWidth || 1) / zoom;
            ctx.strokeRect(item.x, item.y, itemWidth, itemHeight);
          }
          
          // Draw text with proper font settings
          ctx.fillStyle = item.textColor || '#000000';
          ctx.font = `${item.fontSize || 16}px ${item.fontFamily || 'Arial'}`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          
          // Calculate text position to fit within bounds
          let textX = item.x;
          let textY = item.y;
          
          // Add padding
          const padding = 4;
          textX += padding;
          textY += padding;
          
          // Clip text to fit within item bounds
          ctx.save();
          ctx.beginPath();
          ctx.rect(item.x, item.y, itemWidth, itemHeight);
          ctx.clip();
          
          // Draw text
          ctx.fillText(text, textX, textY);
          
          ctx.restore();
        } else {
          // Default rectangle
          ctx.fillRect(item.x, item.y, item.width || 60, item.height || 40);
          ctx.strokeRect(item.x, item.y, item.width || 60, item.height || 40);
          
          // Draw text/label (for non-text items)
          if (item.text || item.label) {
            ctx.fillStyle = item.textColor || '#ffffff';
            ctx.font = `${item.fontSize || 12}px ${item.fontFamily || 'Arial'}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              item.text || item.label, 
              item.x + (item.width || 60) / 2, 
              item.y + (item.height || 40) / 2
            );
          }
        }
        
        ctx.restore();
        
        // Draw transform handles for selected item (if not locked)
        if (isSelected && !item.locked) {
          // For lines, use different handle calculation
          if (item.type === 'line' && item.x2 !== undefined) {
            const handleSize = 8 / zoom;
            ctx.save();
            ctx.strokeStyle = '#3b82f6';
            ctx.fillStyle = '#ffffff';
            ctx.lineWidth = 2 / zoom;
            
            // Draw line selection
            ctx.beginPath();
            ctx.moveTo(item.x, item.y);
            ctx.lineTo(item.x2, item.y2);
            ctx.stroke();
            
            // Draw handles at endpoints
            ctx.fillRect(item.x - handleSize / 2, item.y - handleSize / 2, handleSize, handleSize);
            ctx.strokeRect(item.x - handleSize / 2, item.y - handleSize / 2, handleSize, handleSize);
            ctx.fillRect(item.x2 - handleSize / 2, item.y2 - handleSize / 2, handleSize, handleSize);
            ctx.strokeRect(item.x2 - handleSize / 2, item.y2 - handleSize / 2, handleSize, handleSize);
            
            ctx.restore();
          } else {
            // For other shapes, use standard transform handles
            const handles = getTransformHandles(item);
            const handleSize = 8 / zoom;
            const cx = item.x + (item.width || 60) / 2;
            const cy = item.y + (item.height || 40) / 2;
            
            ctx.save();
            ctx.strokeStyle = '#3b82f6';
            ctx.fillStyle = '#ffffff';
            ctx.lineWidth = 2 / zoom;
            
            // Calculate bounding box for selection
            let boxMinX, boxMinY, boxWidth, boxHeight, boxCx, boxCy;
            if (item.type === 'circle' && item.radius) {
              boxMinX = item.x - item.radius;
              boxMinY = item.y - item.radius;
              boxWidth = item.radius * 2;
              boxHeight = item.radius * 2;
              boxCx = item.x;
              boxCy = item.y;
            } else {
              boxMinX = item.x;
              boxMinY = item.y;
              boxWidth = item.width || 60;
              boxHeight = item.height || 40;
              boxCx = item.x + boxWidth / 2;
              boxCy = item.y + boxHeight / 2;
            }
            
            // Apply rotation for selection box and handles
            if (item.rotation) {
              ctx.translate(boxCx, boxCy);
              ctx.rotate((item.rotation * Math.PI) / 180);
              ctx.translate(-boxCx, -boxCy);
            }
            
            // Draw selection box using bounding box
            ctx.strokeRect(boxMinX, boxMinY, boxWidth, boxHeight);
            
            // Reset transform for handles (they're already rotated in getTransformHandles)
            ctx.restore();
            ctx.save();
            ctx.strokeStyle = '#3b82f6';
            ctx.fillStyle = '#ffffff';
            ctx.lineWidth = 2 / zoom;
            
            // Draw resize handles (already rotated)
            handles.resize.forEach(handle => {
              ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
              ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
            });
            
            // Draw rotate handle (already rotated)
            if (handles.rotate) {
              ctx.beginPath();
              ctx.arc(handles.rotate.x, handles.rotate.y, handleSize / 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              // Draw line from center to rotate handle
              ctx.beginPath();
              ctx.moveTo(boxCx, boxCy);
              ctx.lineTo(handles.rotate.x, handles.rotate.y);
              ctx.stroke();
            }
            
            ctx.restore();
          }
        } else if (isSelected && item.locked) {
          // Draw locked indicator
          ctx.save();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2 / zoom;
          ctx.setLineDash([5 / zoom, 5 / zoom]);
          ctx.strokeRect(item.x, item.y, item.width || 60, item.height || 40);
          ctx.restore();
        }
      });
    }
    
    // Draw current shape being drawn
    if (currentShape && isDrawingShape) {
      ctx.save();
      ctx.fillStyle = currentShape.fillColor || '#3b82f6';
      ctx.strokeStyle = currentShape.strokeColor || '#2563eb';
      ctx.lineWidth = (currentShape.strokeWidth || 2) / zoom;
      
      if (currentShape.type === 'line' && currentShape.x2 !== undefined) {
        ctx.beginPath();
        ctx.moveTo(currentShape.x, currentShape.y);
        ctx.lineTo(currentShape.x2, currentShape.y2);
        ctx.stroke();
      } else if (currentShape.type === 'circle' && currentShape.radius) {
        ctx.beginPath();
        ctx.arc(currentShape.x, currentShape.y, currentShape.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (currentShape.type === 'rectangle' || currentShape.type === 'text') {
        ctx.fillRect(currentShape.x, currentShape.y, currentShape.width || 0, currentShape.height || 0);
        ctx.strokeRect(currentShape.x, currentShape.y, currentShape.width || 0, currentShape.height || 0);
      }
      
      ctx.restore();
    }
    
    ctx.restore();
  }, [canvasData, selectedItem, zoom, pan, canvasSize, showGridlines, showRulers, currentShape, isDrawingShape, getTransformHandles]);

  // Redraw canvas when data changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Save canvas data (debounced to avoid too many saves)
  useEffect(() => {
    if (!onCanvasUpdate || !floorName) return;
    
    const timeoutId = setTimeout(() => {
      const data = {
        floorName,
        items: canvasData?.items || [],
        canvasSize,
        lastUpdated: new Date().toISOString()
      };
      onCanvasUpdate(data);
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(timeoutId);
  }, [canvasData?.items, floorName, onCanvasUpdate]);

  return (
    <div className="relative w-full h-full">
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="border-2 border-gray-200 rounded-lg overflow-auto bg-white relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        style={{ height: '600px', cursor: zoomToolActive ? 'zoom-in' 
          : isPanning ? 'grabbing' 
          : isDrawing || activeTool ? 'crosshair' 
          : isRotating ? 'grab'
          : isResizing ? (hoveredHandle === 'resize' ? 'nwse-resize' : 'move')
          : hoveredHandle === 'rotate' ? 'grab'
          : hoveredHandle === 'resize' ? 'nwse-resize'
          : isDragging ? 'move' 
          : 'default' }}
      >
        <div className="relative" style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px`, minWidth: '100%', minHeight: '100%' }}>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={handleCanvasClick}
            onDoubleClick={handleDoubleClick}
            style={{ 
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 0,
              cursor: zoomToolActive ? 'zoom-in' 
                : isDrawing || activeTool ? 'crosshair' 
                : isPanning ? 'grabbing' 
                : isRotating ? 'grab'
                : isResizing ? (hoveredHandle === 'resize' ? 'nwse-resize' : 'move')
                : hoveredHandle === 'rotate' ? 'grab'
                : hoveredHandle === 'resize' ? 'nwse-resize'
                : isDragging ? 'move' 
                : 'default'
            }}
          />
          
          {/* Text editing input overlay */}
          {currentEditingText && (() => {
            const item = canvasData.items?.find(i => i.id === currentEditingText);
            if (!item) return null;
            
            const container = containerRef.current;
            const canvas = canvasRef.current;
            if (!container || !canvas) return null;
            
            const containerRect = container.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const scrollLeft = container.scrollLeft || 0;
            const scrollTop = container.scrollTop || 0;
            
            // Calculate position accounting for zoom, pan, and scroll
            // Position input exactly where the item is on the canvas
            const itemWidth = item.width || (item.type === 'circle' ? item.radius * 2 : 100);
            const itemHeight = item.height || (item.type === 'circle' ? item.radius * 2 : 30);
            
            // Calculate position relative to viewport, then adjust for container position
            // Canvas is positioned absolutely, so we need to account for its position
            const canvasOffsetX = canvasRect.left - containerRect.left;
            const canvasOffsetY = canvasRect.top - containerRect.top;
            
            // Calculate position relative to container
            const left = canvasOffsetX + (item.x * zoom) + pan.x - scrollLeft;
            const top = canvasOffsetY + (item.y * zoom) + pan.y - scrollTop;
            
            const width = itemWidth * zoom;
            const height = itemHeight * zoom;
            
            return (
              <input
                type="text"
                value={item.text || item.label || ''}
                onChange={(e) => {
                  if (onItemUpdate) {
                    onItemUpdate(currentEditingText, { text: e.target.value, label: e.target.value });
                  }
                }}
                onBlur={() => {
                  // Only blur if not clicking on text options
                  setTimeout(() => {
                    const activeElement = document.activeElement;
                    if (!activeElement || !activeElement.closest('.text-options-container')) {
                      setCurrentEditingText(null);
                    }
                  }, 200);
                }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    setCurrentEditingText(null);
                  }
                }}
                autoFocus
                className="absolute border-2 border-teal-500 bg-white px-2 py-1 text-sm focus:outline-none z-50"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  fontSize: `${item.fontSize || 16}px`,
                  color: item.textColor || '#000000',
                  textAlign: 'left',
                  transform: item.rotation ? `rotate(${item.rotation}deg)` : 'none',
                  transformOrigin: `${itemWidth * zoom / 2}px ${itemHeight * zoom / 2}px`,
                  fontFamily: item.fontFamily || 'Arial',
                  boxSizing: 'border-box',
                  padding: '4px',
                  overflow: 'hidden',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
              />
            );
          })()}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 min-w-[150px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            transform: 'translate(-50%, 0)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleContextMenuAction('duplicate')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Duplicate
          </button>
          <button
            onClick={() => handleContextMenuAction('lock')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {(() => {
              const item = canvasData.items?.find(i => i.id === contextMenu.itemId);
              return item?.locked ? 'Unlock' : 'Lock';
            })()}
          </button>
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={() => handleContextMenuAction('group')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Group
          </button>
          <button
            onClick={() => handleContextMenuAction('putToBack')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Put to Back
          </button>
          <button
            onClick={() => handleContextMenuAction('putToFront')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Put in Front
          </button>
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={() => handleContextMenuAction('delete')}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
