'use client';

import { useState, useEffect } from "react";
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import Part1 from "./components/parts/Part1";
import Part2 from "./components/parts/Part2";
import Part3 from "./components/parts/Part3";
import Part4 from "./components/parts/Part4";
import Part5 from "./components/parts/Part5";
import Part6 from "./components/parts/Part6";
import Part7 from "./components/parts/Part7";
import Part8 from "./components/parts/Part8";
import DeskAssignmentModal from "./components/DeskAssignmentModal";

export default function DedicatedDesk() {
  const [zoom, setZoom] = useState(0.3);
  const [showModal, setShowModal] = useState(false);
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [deskAssignments, setDeskAssignments] = useState({});
  
  // Fetch desk assignments from Firebase
  useEffect(() => {
    if (!db) return;
    
    const unsubscribe = onSnapshot(collection(db, 'desk-assignments'), (snapshot) => {
      const assignments = {};
      snapshot.forEach((doc) => {
        assignments[doc.id] = doc.data();
      });
      setDeskAssignments(assignments);
    });

    return () => unsubscribe();
  }, []);
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));
  const handleResetZoom = () => setZoom(1);
  
  const handleDeskClick = (deskTag) => {
    setSelectedDesk(deskTag);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDesk(null);
  };

  const handleSaveAssignment = async (deskTag, assignmentData) => {
    if (!db) {
      alert("Database not available. Please check your Firebase configuration.");
      return;
    }

    try {
      const deskRef = doc(db, 'desk-assignments', deskTag);
      
      if (assignmentData === null) {
        // Delete assignment
        await deleteDoc(deskRef);
      } else {
        // Save or update assignment
        await setDoc(deskRef, {
          desk: deskTag,
          name: assignmentData.name,
          type: assignmentData.type,
          assignedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error saving desk assignment:", error);
      throw error;
    }
  };

  // Dimensions for positioning
  const deskWidth = 80;
  const horizontalContainerHeight = 70;
  const pairHeight = 136;
  const rowGap = 20;
  const wallSize = 120;
  const deskHeight = 80;
  
  const topRowStartY = 40;
  const part1Height = topRowStartY + horizontalContainerHeight + rowGap + 3 * (pairHeight + rowGap);
  const part1TopWallX = 5 * deskWidth;
  const part3StartX = part1TopWallX + wallSize + 80;
  const verticalContainerWidth = 90;
  const verticalPairWidth = 156;
  
  const part3Col4X = part3StartX + verticalContainerWidth + 2 * verticalPairWidth;
  const part3WallX = part3Col4X + 26 + 40 - 60;
  
  const part2StartY = part1Height + 100;
  
  const part4StartY = wallSize - 5 + 7 * deskHeight + 60;
  const part4StartX = part3StartX - 40;
  
  const part5StartX = part3Col4X + verticalPairWidth + 60;
  const part5StartY = 136;
  
  const part5WallX = part5StartX + 5 * deskWidth + 40;
  
  const part6WallX = part5WallX;
  const part6WallY = part2StartY;
  
  const part7StartX = part5WallX + wallSize + 2 * verticalPairWidth - 100;
  const part7StartY = 136;
  
  const part7WallX = part7StartX + 5 * deskWidth - 30 - 50;
  
  const part8WallX = part7WallX;
  const part8WallY = part2StartY;
  const part8StartX = part7StartX + deskWidth;
  const part8StartY = part8WallY + wallSize - 5 + 20;

  return (
    <div className="w-full relative">
      <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Dedicated Desk</h1>
      
      {/* Zoom Controls - positioned outside scrollable area */}
      <div className="absolute top-12 right-4 z-20 flex flex-row gap-2 bg-white rounded-lg shadow-lg p-2">
        <button 
          onClick={handleZoomIn}
          className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-xl font-bold"
        >
          +
        </button>
        <button 
          onClick={handleResetZoom}
          className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-xs font-bold"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button 
          onClick={handleZoomOut}
          className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-xl font-bold"
        >
          −
        </button>
      </div>
      
      <div
        className="bg-gray-100 rounded-xl border border-gray-200"
        style={{
          backgroundImage: "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          width: "100%",
          height: "calc(100vh - 180px)",
          overflow: "auto",
        }}
      >
        
        <div 
          className="relative" 
          style={{ 
            width: "800px", 
            height: "400px", 
            marginLeft: "20px",
            marginTop: "20px",
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <div style={{ position: 'absolute', left: '420px', top: '80px' }}>
            <Part1 onDeskClick={handleDeskClick} tagPrefix="A" />
            <Part2 onDeskClick={handleDeskClick} startY={part2StartY} tagPrefix="B" />
            <Part3 onDeskClick={handleDeskClick} startX={part3StartX} tagPrefix="C" />
            <Part4 onDeskClick={handleDeskClick} startX={part4StartX} startY={part4StartY} wallAlignX={part3WallX} wallAlignY={part2StartY} tagPrefix="D" />
          </div>
          <div style={{ position: 'absolute', left: '470px', top: '80px' }}>
            <Part5 onDeskClick={handleDeskClick} startX={part5StartX} startY={part5StartY} wallAlignX={part5WallX} tagPrefix="E" />
            <Part6 onDeskClick={handleDeskClick} wallAlignX={part6WallX} wallAlignY={part6WallY} tagPrefix="F" />
            <Part7 onDeskClick={handleDeskClick} startX={part7StartX} startY={part7StartY} wallAlignX={part7WallX} tagPrefix="G" />
            <Part8 onDeskClick={handleDeskClick} startX={part8StartX} startY={part8StartY} wallAlignX={part8WallX} wallAlignY={part8WallY} tagPrefix="H" />
          </div>
        </div>
      </div>

      {/* Desk Assignment Modal */}
      <DeskAssignmentModal
        isOpen={showModal}
        onClose={handleCloseModal}
        deskTag={selectedDesk}
        existingAssignment={selectedDesk ? deskAssignments[selectedDesk] : null}
        onSave={handleSaveAssignment}
      />
    </div>
  );
}
