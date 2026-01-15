'use client';

import { useState, useEffect } from "react";
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, getDoc, updateDoc } from 'firebase/firestore';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [partZoom, setPartZoom] = useState(0.5);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  
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

  // Helper function to fetch all requests
  const fetchAllRequests = async () => {
    if (!db) return [];
    
    const allRequests = [];
    
    // Get all client users
    const usersRef = collection(db, 'accounts', 'client', 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    // Helper function to check if value is valid
    const isValidValue = (value) => {
      if (value === null || value === undefined) return false;
      const strValue = String(value).trim();
      if (strValue === '') return false;
      if (strValue.toUpperCase() === 'N/A') return false;
      if (strValue.toUpperCase() === 'NA') return false;
      if (strValue.toLowerCase() === 'null') return false;
      if (strValue.toLowerCase() === 'undefined') return false;
      return true;
    };
    
    // For each user, check if they have desk requests
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Check for desk request only (dedicated desk page)
      const deskRequestRef = doc(collection(db, 'accounts', 'client', 'users', userId, 'request'), 'desk');
      const deskRequestDoc = await getDoc(deskRequestRef);
      
      if (deskRequestDoc.exists()) {
        const requestData = deskRequestDoc.data();
        const deskId = requestData.deskId;
        const section = requestData.section;
        const location = requestData.location;
        
        const hasDeskId = isValidValue(deskId);
        const hasSection = isValidValue(section);
        const hasLocation = isValidValue(location);
        const isDeskIdNA = deskId && String(deskId).trim().toUpperCase() === 'N/A';
        const isDeskRequest = requestData.requestType !== 'privateroom' && 
                               (!requestData.requestType || requestData.requestType === 'desk');
        
        // Filter out approved requests - they should not appear in the requests section
        const isNotApproved = requestData.status !== 'approved';
        
        if (!isDeskIdNA && hasDeskId && hasSection && hasLocation && isDeskRequest && isNotApproved) {
          allRequests.push({
            id: `${userId}-desk`,
            userId: userId,
            requestType: 'desk',
            ...requestData,
            userInfo: {
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              companyName: userData.companyName || '',
              contact: userData.contact || '',
            }
          });
        }
      }
    }
    
    // Sort by requestDate (newest first)
    allRequests.sort((a, b) => {
      const dateA = new Date(a.requestDate || a.createdAt || 0);
      const dateB = new Date(b.requestDate || b.createdAt || 0);
      return dateB - dateA;
    });
    
    return allRequests;
  };

  // Fetch all user requests from Firebase
  useEffect(() => {
    if (!db || activeTab !== 'requests') return;
    
    const fetchRequests = async () => {
      setLoadingRequests(true);
      try {
        const requests = await fetchAllRequests();
        setRequests(requests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    };
    
    fetchRequests();
  }, [activeTab]);
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));
  const handleResetZoom = () => setZoom(1);
  
  const handlePartZoomIn = () => setPartZoom(prev => Math.min(prev + 0.1, 2));
  const handlePartZoomOut = () => setPartZoom(prev => Math.max(prev - 0.1, 0.3));
  const handlePartResetZoom = () => setPartZoom(1);
  
  const handleDeskClick = (deskTag) => {
    setSelectedDesk(deskTag);
    setShowModal(true);
  };

  // Handle accept request
  const handleAcceptRequest = async (request) => {
    if (!db) return;
    
    if (!request.deskId) {
      alert('Error: Desk ID is missing from the request.');
      return;
    }
    
    try {
      // Update request status
      const requestRef = doc(collection(db, 'accounts', 'client', 'users', request.userId, 'request'), 'desk');
      await updateDoc(requestRef, {
        status: 'approved',
        updatedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString()
      });
      
      // Automatically assign the desk to the user
      const deskTag = request.deskId; // e.g., "A1", "A16"
      const deskRef = doc(db, 'desk-assignments', deskTag);
      
      // Prepare assignment data from request
      const fullName = `${request.userInfo?.firstName || ''} ${request.userInfo?.lastName || ''}`.trim();
      const assignmentData = {
        desk: deskTag,
        name: fullName || 'Unknown',
        type: 'Tenant', // Always set as Tenant when accepting from requests
        email: request.userInfo?.email || request.requestedBy?.email || '',
        contactNumber: request.userInfo?.contact || request.requestedBy?.contact || '',
        company: request.userInfo?.companyName || request.requestedBy?.companyName || '',
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save desk assignment
      await setDoc(deskRef, assignmentData, { merge: true });
      
      // Refresh requests list
      const requests = await fetchAllRequests();
      setRequests(requests);
      
      alert(`Request approved successfully! Desk ${deskTag} has been assigned to ${fullName}.`);
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to approve request. Please try again.');
    }
  };

  // Handle reject request
  const handleRejectRequest = async (request) => {
    if (!db) return;
    
    if (!confirm(`Are you sure you want to reject the desk request for ${request.userInfo?.firstName} ${request.userInfo?.lastName}?`)) {
      return;
    }
    
    try {
      const requestRef = doc(collection(db, 'accounts', 'client', 'users', request.userId, 'request'), 'desk');
      await updateDoc(requestRef, {
        status: 'rejected',
        updatedAt: new Date().toISOString(),
        rejectedAt: new Date().toISOString()
      });
      
      // Refresh requests list
      const requests = await fetchAllRequests();
      setRequests(requests);
      alert('Request rejected successfully!');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    }
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
      { number: 1, component: Part1, tagPrefix: "A" },
      { number: 2, component: Part2, tagPrefix: "B" },
      { number: 3, component: Part3, tagPrefix: "C" },
      { number: 4, component: Part4, tagPrefix: "D" },
      { number: 5, component: Part5, tagPrefix: "E" },
      { number: 6, component: Part6, tagPrefix: "F" },
      { number: 7, component: Part7, tagPrefix: "G" },
      { number: 8, component: Part8, tagPrefix: "H" },
    ];

    const selectedPartData = selectedPart ? parts.find(p => p.number === selectedPart) : null;
    const PartComponent = selectedPartData?.component;

    return (
      <div className="bg-gray-100 rounded-xl border border-gray-200 relative" style={{
        backgroundImage: "radial-gradient(circle, #d1d1d1 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        width: "100%",
        height: "calc(100vh - 280px)",
        minHeight: "500px",
        overflow: "auto",
      }}>
        {/* Header with Dropdown and Zoom Controls */}
        <div className="sticky top-0 left-0 z-30 p-4 bg-linear-to-b from-gray-100 via-gray-100 to-transparent">
          <div className="flex items-start justify-between">
            {/* Part Selector Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-800 font-semibold text-sm">Select Part to View</label>
              <div className="relative w-48">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-slate-800 hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    {selectedPartData ? (
                      <>
                        <span className="w-6 h-6 flex items-center justify-center bg-teal-600 text-white text-xs font-bold rounded-md">
                          {selectedPartData.tagPrefix}
                        </span>
                        <span>Part {selectedPartData.number}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">Choose a part...</span>
                    )}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {parts.map((part) => (
                        <button
                          key={part.number}
                          onClick={() => {
                            setSelectedPart(part.number);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-all ${
                            selectedPart === part.number
                              ? 'bg-teal-50 text-teal-700'
                              : 'text-slate-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-md ${
                            selectedPart === part.number
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-100 text-slate-600'
                          }`}>
                            {part.tagPrefix}
                          </span>
                          <span>Part {part.number}</span>
                          {selectedPart === part.number && (
                            <svg className="w-4 h-4 ml-auto text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex flex-row gap-1 bg-white rounded-lg shadow-lg p-1">
              <button 
                onClick={handlePartZoomIn}
                className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-base font-bold"
              >
                +
              </button>
              <button 
                onClick={handlePartResetZoom}
                className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-[10px] font-bold"
              >
                {Math.round(partZoom * 100)}%
              </button>
              <button 
                onClick={handlePartZoomOut}
                className="w-7 h-7 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-base font-bold"
              >
                −
              </button>
            </div>
          </div>
        </div>

        {/* Selected Part Display - Centered */}
        {selectedPartData && PartComponent ? (
          <div className="flex items-center justify-center w-full p-8" style={{ minHeight: "400px" }}>
            <div 
              className="relative" 
              style={{ 
                width: "700px", 
                height: "600px",
                transform: `scale(${partZoom})`,
                transformOrigin: "top left",
              }}
            >
              <PartComponent
                onDeskClick={handleDeskClick}
                tagPrefix={selectedPartData.tagPrefix}
                deskAssignments={deskAssignments}
                zoom={partZoom}
                startX={0}
                startY={0}
                wallAlignX={400}
                wallAlignY={0}
                isStandalone={true}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-16">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg font-medium">Select a part to view</p>
            <p className="text-gray-400 text-sm mt-1">Choose from the dropdown above</p>
          </div>
        )}
      </div>
    );
  };

  // Render Requests View
  const renderRequestsView = () => {
    if (loadingRequests) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-slideUp">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading requests...</div>
          </div>
        </div>
      );
    }

    if (requests.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-slideUp">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg font-medium">No requests found</p>
            <p className="text-gray-400 text-sm mt-1">All requests will appear here</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-slideUp">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Name</th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Email</th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Company</th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Details</th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Request Date</th>
                <th className="px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-800 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((request) => (
                <tr key={request.id} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-slate-800 font-semibold text-sm">
                      {request.userInfo?.firstName || ''} {request.userInfo?.lastName || ''}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm">{request.userInfo?.email || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm">{request.userInfo?.companyName || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm">{request.userInfo?.contact || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-600">
                      <div><span className="font-semibold">Desk:</span> {request.deskId || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-600 text-sm">
                      {request.requestDate 
                        ? new Date(request.requestDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => handleAcceptRequest(request)}
                        disabled={request.status === 'approved'}
                        className={`group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ease-out ${
                          request.status === 'approved'
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'bg-linear-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-emerald-500/50 border-0'
                        }`}
                        title={request.status === 'approved' ? 'Request already approved' : 'Approve this request'}
                      >
                        <svg className={`w-4 h-4 transition-transform duration-300 ${request.status !== 'approved' ? 'group-hover:scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Accept</span>
                        {request.status !== 'approved' && (
                          <span className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        disabled={request.status === 'rejected'}
                        className={`group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ease-out ${
                          request.status === 'rejected'
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'bg-linear-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-red-500/50 border-0'
                        }`}
                        title={request.status === 'rejected' ? 'Request already rejected' : 'Reject this request'}
                      >
                        <svg className={`w-4 h-4 transition-transform duration-300 ${request.status !== 'rejected' ? 'group-hover:scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Reject</span>
                        {request.status !== 'rejected' && (
                          <span className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render List View
  const renderListView = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-slideUp">
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
                    <button
                      onClick={() => {
                        setSelectedUserInfo(assignment);
                        setShowUserInfoModal(true);
                      }}
                      className="text-gray-600 text-sm hover:text-teal-600 hover:underline transition-colors cursor-pointer font-medium"
                    >
                      {assignment.name || 'N/A'}
                    </button>
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
      <h1 className={`text-slate-800 text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>Dedicated Desk</h1>
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-3 sm:mb-4 border-b-2 border-gray-200">
        {[
          { key: 'floor-plan', label: 'Floor Plan' },
          { key: 'by-part', label: 'By Part' },
          { key: 'list', label: 'List' },
          { key: 'requests', label: 'Requests' }
        ].map((tab, index) => (
          <button 
            key={tab.key} 
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === 'by-part' && !selectedPart) {
                setSelectedPart(1); // Default to Part 1 when switching to By Part tab
              }
            }} 
            className={`px-4 sm:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-medium transition-all duration-300 border-b-[3px] -mb-0.5 whitespace-nowrap ${
              activeTab === tab.key 
                ? 'text-slate-800 border-teal-600' 
                : 'text-gray-500 border-transparent hover:text-slate-800 hover:bg-slate-800/5'
            }`}
            style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(-10px)',
              transition: `opacity 0.3s ease-out ${index * 0.05 + 0.1}s, transform 0.3s ease-out ${index * 0.05 + 0.1}s, color 0.2s, background-color 0.2s, border-color 0.2s`
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 xl:p-6 shadow-lg shadow-slate-800/5 border border-gray-200 transition-all duration-500 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'}`} style={{ transitionDelay: '0.2s' }}>
        <div key={activeTab} className="animate-fadeIn">
          {activeTab === 'floor-plan' && renderFloorPlanView()}
          {activeTab === 'by-part' && renderByPartView()}
          {activeTab === 'list' && renderListView()}
          {activeTab === 'requests' && renderRequestsView()}
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

      {/* User Info Modal */}
      {showUserInfoModal && selectedUserInfo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowUserInfoModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-800">User Information</h3>
              <button
                onClick={() => setShowUserInfoModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Name</label>
                <p className="text-lg text-slate-800 mt-1">{selectedUserInfo.name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Type</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedUserInfo.type === 'Tenant' 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {selectedUserInfo.type || 'N/A'}
                  </span>
                </p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Email</label>
                <p className="text-lg text-slate-800 mt-1">{selectedUserInfo.email || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Contact Number</label>
                <p className="text-lg text-slate-800 mt-1">{selectedUserInfo.contactNumber || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Company</label>
                <p className="text-lg text-slate-800 mt-1 font-medium">{selectedUserInfo.company || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Desk</label>
                <p className="text-lg text-slate-800 mt-1 font-semibold">{selectedUserInfo.deskTag || selectedUserInfo.desk || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Assigned At</label>
                <p className="text-lg text-slate-800 mt-1">
                  {selectedUserInfo.assignedAt 
                    ? new Date(selectedUserInfo.assignedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
