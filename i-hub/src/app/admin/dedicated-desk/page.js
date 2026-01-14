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
  const [activeTab, setActiveTab] = useState('floor-plan');
  const [zoom, setZoom] = useState(0.3);
  const [showModal, setShowModal] = useState(false);
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [deskAssignments, setDeskAssignments] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  
  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
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
      // Database error will be handled by the modal's error handling
      throw new Error("Database not available. Please check your Firebase configuration.");
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
          email: assignmentData.email || "",
          contactNumber: assignmentData.contactNumber || "",
          company: assignmentData.company || "",
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

  // Convert deskAssignments object to array for list view
  const assignmentsList = Object.keys(deskAssignments).map(deskTag => ({
    deskTag,
    ...deskAssignments[deskTag]
  })).sort((a, b) => {
    // Sort by part letter first, then by number
    const partA = a.deskTag.charAt(0);
    const partB = b.deskTag.charAt(0);
    if (partA !== partB) return partA.localeCompare(partB);
    const numA = parseInt(a.deskTag.slice(1)) || 0;
    const numB = parseInt(b.deskTag.slice(1)) || 0;
    return numA - numB;
  });

  // Render Floor Plan View
  const renderFloorPlanView = () => (
    <div className="relative">
      {/* Zoom Controls - positioned outside scrollable area */}
      {activeTab === 'floor-plan' && (
        <div className={`absolute top-0 right-0 z-20 flex flex-row gap-1 bg-white rounded-lg shadow-lg p-1 transition-all duration-500 delay-200 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
          <button 
            onClick={handleZoomIn}
            className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-base font-bold"
          >
            +
          </button>
          <button 
            onClick={handleResetZoom}
            className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-[10px] font-bold"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button 
            onClick={handleZoomOut}
            className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-base font-bold"
          >
            −
          </button>
        </div>
      )}
      
      <div
        className={`bg-gray-100 rounded-xl border border-gray-200 transition-all duration-500 delay-100 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{
          backgroundImage: "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          width: "100%",
          height: "calc(100vh - 240px)",
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
            <Part1 onDeskClick={handleDeskClick} tagPrefix="A" deskAssignments={deskAssignments} zoom={zoom} />
            <Part2 onDeskClick={handleDeskClick} startY={part2StartY} tagPrefix="B" deskAssignments={deskAssignments} zoom={zoom} />
            <Part3 onDeskClick={handleDeskClick} startX={part3StartX} tagPrefix="C" deskAssignments={deskAssignments} zoom={zoom} />
            <Part4 onDeskClick={handleDeskClick} startX={part4StartX} startY={part4StartY} wallAlignX={part3WallX} wallAlignY={part2StartY} tagPrefix="D" deskAssignments={deskAssignments} zoom={zoom} />
          </div>
          <div style={{ position: 'absolute', left: '470px', top: '80px' }}>
            <Part5 onDeskClick={handleDeskClick} startX={part5StartX} startY={part5StartY} wallAlignX={part5WallX} tagPrefix="E" deskAssignments={deskAssignments} zoom={zoom} />
            <Part6 onDeskClick={handleDeskClick} wallAlignX={part6WallX} wallAlignY={part6WallY} tagPrefix="F" deskAssignments={deskAssignments} zoom={zoom} />
            <Part7 onDeskClick={handleDeskClick} startX={part7StartX} startY={part7StartY} wallAlignX={part7WallX} tagPrefix="G" deskAssignments={deskAssignments} zoom={zoom} />
            <Part8 onDeskClick={handleDeskClick} startX={part8StartX} startY={part8StartY} wallAlignX={part8WallX} wallAlignY={part8WallY} tagPrefix="H" deskAssignments={deskAssignments} zoom={zoom} />
          </div>
        </div>
      </div>
    </div>
  );

  // Render By Part View
  const renderByPartView = () => {
    const parts = [
      { number: 1, component: Part1, tagPrefix: "A", props: {} },
      { number: 2, component: Part2, tagPrefix: "B", props: { startY: part2StartY } },
      { number: 3, component: Part3, tagPrefix: "C", props: { startX: part3StartX } },
      { number: 4, component: Part4, tagPrefix: "D", props: { startX: part4StartX, startY: part4StartY, wallAlignX: part3WallX, wallAlignY: part2StartY } },
      { number: 5, component: Part5, tagPrefix: "E", props: { startX: part5StartX, startY: part5StartY, wallAlignX: part5WallX } },
      { number: 6, component: Part6, tagPrefix: "F", props: { wallAlignX: part6WallX, wallAlignY: part6WallY } },
      { number: 7, component: Part7, tagPrefix: "G", props: { startX: part7StartX, startY: part7StartY, wallAlignX: part7WallX } },
      { number: 8, component: Part8, tagPrefix: "H", props: { startX: part8StartX, startY: part8StartY, wallAlignX: part8WallX, wallAlignY: part8WallY } },
    ];

    const selectedPartData = selectedPart ? parts.find(p => p.number === selectedPart) : null;
    const PartComponent = selectedPartData?.component;

    return (
      <div className="space-y-4">
        {/* Part Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="block text-slate-800 font-semibold text-sm mb-3">Select Part to View</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {parts.map((part) => (
              <button
                key={part.number}
                onClick={() => setSelectedPart(part.number)}
                className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  selectedPart === part.number
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                    : 'bg-gray-100 text-slate-800 hover:bg-gray-200'
                }`}
              >
                Part {part.number} ({part.tagPrefix})
              </button>
            ))}
          </div>
        </div>

        {/* Selected Part Display */}
        {selectedPartData && PartComponent ? (
          <div className="bg-gray-100 rounded-xl border border-gray-200 relative" style={{
            backgroundImage: "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            width: "100%",
            minHeight: "500px",
            overflow: "auto",
            padding: "40px",
          }}>
            <div className="flex justify-center items-start">
              <PartComponent
                onDeskClick={handleDeskClick}
                tagPrefix={selectedPartData.tagPrefix}
                deskAssignments={deskAssignments}
                zoom={1}
                {...selectedPartData.props}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">Please select a part to view</p>
          </div>
        )}
      </div>
    );
  };

  // Render List View
  const renderListView = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Desk</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Name</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Type</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Email</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Contact Number</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Company</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Assigned At</th>
              <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignmentsList.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                  No desk assignments found.
                </td>
              </tr>
            ) : (
              assignmentsList.map((assignment) => (
                <tr key={assignment.deskTag} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-slate-800 font-semibold text-sm">{assignment.deskTag}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm">{assignment.name || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      assignment.type === 'Tenant' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {assignment.type || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm truncate block max-w-[200px]" title={assignment.email || 'N/A'}>
                      {assignment.email || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm">{assignment.contactNumber || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm">{assignment.company || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm">
                      {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => {
                        setSelectedDesk(assignment.deskTag);
                        setShowModal(true);
                      }}
                      className="px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={`w-full relative transition-all duration-500 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <h1 className="text-slate-800 text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Dedicated Desk</h1>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-3 sm:mb-4 border-b-2 border-gray-200">
        {[
          { key: 'floor-plan', label: 'Floor Plan' },
          { key: 'by-part', label: 'By Part' },
          { key: 'list', label: 'List' }
        ].map(tab => (
          <button 
            key={tab.key} 
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === 'by-part' && !selectedPart) {
                setSelectedPart(1); // Default to Part 1 when switching to By Part tab
              }
            }} 
            className={`px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-medium transition-all border-b-[3px] -mb-0.5 whitespace-nowrap ${
              activeTab === tab.key 
                ? 'text-slate-800 border-teal-600' 
                : 'text-gray-500 border-transparent hover:text-slate-800 hover:bg-slate-800/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 xl:p-6 shadow-lg shadow-slate-800/5 border border-gray-200">
        {activeTab === 'floor-plan' && renderFloorPlanView()}
        {activeTab === 'by-part' && renderByPartView()}
        {activeTab === 'list' && renderListView()}
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
