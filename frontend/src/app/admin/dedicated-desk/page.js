'use client';

import { useState, useEffect } from "react";
import { api } from '@/lib/api';

// Import tab components
import FloorPlanView from "./tabs/FloorPlan";
import ByPartView from "./tabs/ByPart";
import ListView from "./tabs/List";
import RequestsView from "./tabs/Requests";
import DeskAssignmentModal from "./tabs/FloorPlan/DeskAssignmentModal";

export default function DedicatedDesk() {
  const [activeTab, setActiveTab] = useState('floor-plan');
  const [zoom, setZoom] = useState(0.4);
  const [showModal, setShowModal] = useState(false);
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [deskAssignments, setDeskAssignments] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
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
  
  // Fetch desk assignments from backend with real-time updates
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await api.get('/api/desk-assignments');
        if (response.success && response.data) {
          const assignments = {};
          response.data.forEach((assignment) => {
            assignments[assignment.id] = assignment;
          });
          setDeskAssignments(assignments);
        }
      } catch (error) {
        console.error('Error fetching desk assignments:', error);
      }
    };

    // Initial fetch
    fetchAssignments();
    
    // Real-time polling: Update every 2 seconds for instant reflection
    const interval = setInterval(fetchAssignments, 2000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to fetch all requests from backend
  const fetchAllRequests = async () => {
    try {
      const response = await api.get('/api/accounts/desk-requests');
      
      if (response.success && response.data) {
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
        
        // Get user info for each request
        const allRequests = [];
        for (const request of response.data) {
          const requestData = request;
          const deskId = requestData.deskId;
          const section = requestData.section;
          const location = requestData.location;
          
          const hasDeskId = isValidValue(deskId);
          const hasSection = isValidValue(section);
          const hasLocation = isValidValue(location);
          const isDeskIdNA = deskId && String(deskId).trim().toUpperCase() === 'N/A';
          const isDeskRequest = requestData.requestType !== 'privateroom' && 
                                 (!requestData.requestType || requestData.requestType === 'desk');
          // Show pending and rejected requests (hide only approved ones)
          // Rejected requests are kept visible so admins can delete them
          const isNotApproved = requestData.status !== 'approved';
          
          if (!isDeskIdNA && hasDeskId && hasSection && hasLocation && isDeskRequest && isNotApproved) {
            // Fetch user info
            try {
              const userResponse = await api.get(`/api/accounts/client/users/${request.userId}`);
              if (userResponse.success && userResponse.data) {
                allRequests.push({
                  id: `${request.userId}-desk`,
                  userId: request.userId,
                  requestType: 'desk',
                  ...requestData,
                  userInfo: {
                    firstName: userResponse.data.firstName || '',
                    lastName: userResponse.data.lastName || '',
                    email: userResponse.data.email || '',
                    companyName: userResponse.data.companyName || '',
                    contact: userResponse.data.contact || '',
                  }
                });
              }
            } catch (error) {
              console.error('Error fetching user info:', error);
            }
          }
        }
        
        allRequests.sort((a, b) => {
          const dateA = new Date(a.requestDate || a.createdAt || 0);
          const dateB = new Date(b.requestDate || b.createdAt || 0);
          return dateB - dateA;
        });
        
        return allRequests;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching requests:', error);
      return [];
    }
  };

  // Fetch all user requests from backend with real-time updates
  useEffect(() => {
    if (activeTab !== 'requests') {
      setLoadingRequests(false);
      return;
    }
    
    const fetchRequests = async () => {
      // Only show loading on initial fetch
      if (requests.length === 0) {
        setLoadingRequests(true);
      }
      try {
        const requestsData = await fetchAllRequests();
        setRequests(requestsData);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    };
    
    // Initial fetch
    fetchRequests();
    
    // Real-time polling: Update every 2 seconds when requests tab is active
    const interval = setInterval(fetchRequests, 2000);
    return () => clearInterval(interval);
  }, [activeTab]);
  
  // Zoom handlers
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
    if (!request.deskId) {
      alert('Error: Desk ID is missing from the request.');
      return;
    }

    if (!confirm(`Are you sure you want to approve the desk request for ${request.userInfo?.firstName || ''} ${request.userInfo?.lastName || ''}? Desk ${request.deskId} will be assigned.`)) {
      return;
    }
    
    try {
      const deskTag = request.deskId;
      
      const fullName = `${request.userInfo?.firstName || ''} ${request.userInfo?.lastName || ''}`.trim();
      const assignmentData = {
        desk: deskTag,
        name: fullName || 'Unknown',
        type: 'Tenant',
        email: request.userInfo?.email || request.requestedBy?.email || '',
        contactNumber: request.userInfo?.contact || request.requestedBy?.contact || '',
        company: request.userInfo?.companyName || request.requestedBy?.companyName || '',
        assignedAt: new Date().toISOString()
      };
      
      // Create or update desk assignment
      const assignmentResponse = await api.post('/api/desk-assignments', assignmentData);
      
      if (assignmentResponse.success) {
        // Update request status to 'approved' via backend
        try {
          await api.put(`/api/accounts/client/users/${request.userId}/request/desk`, {
            ...request, // Preserve existing request data
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: 'admin', // You can enhance this to use actual admin user ID
          });
        } catch (updateError) {
          console.error('Error updating request status:', updateError);
          // Continue even if status update fails, assignment was created successfully
        }
        
        // Immediately remove the request from the UI (optimistic update)
        setRequests(prevRequests => prevRequests.filter(r => !(r.id === request.id && r.userId === request.userId)));
        
        // Immediately refresh assignments for real-time update
        try {
          const assignmentsResponse = await api.get('/api/desk-assignments');
          if (assignmentsResponse.success && assignmentsResponse.data) {
            const assignments = {};
            assignmentsResponse.data.forEach((assignment) => {
              assignments[assignment.id] = assignment;
            });
            setDeskAssignments(assignments);
          }
        } catch (error) {
          console.error('Error refreshing assignments:', error);
        }
        
        // Immediately refresh requests for real-time update
        try {
          const requestsData = await fetchAllRequests();
          setRequests(requestsData);
        } catch (error) {
          console.error('Error refreshing requests:', error);
        }
        
        alert(`Request approved successfully! Desk ${deskTag} has been assigned to ${fullName}.`);
      } else {
        alert(assignmentResponse.message || 'Failed to approve request. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert(error.message || 'Failed to approve request. Please try again.');
    }
  };

  // Handle reject request
  const handleRejectRequest = async (request) => {
    if (!confirm(`Are you sure you want to reject the desk request for ${request.userInfo?.firstName || ''} ${request.userInfo?.lastName || ''}?`)) {
      return;
    }
    
    try {
      const response = await api.put(`/api/accounts/client/users/${request.userId}/request/desk`, {
        ...request, // Preserve existing request data
        status: 'rejected',
        rejectedAt: new Date().toISOString()
      });
      
      if (response.success) {
        // Update the request status in the UI (don't remove rejected requests - they stay visible for deletion)
        setRequests(prevRequests => prevRequests.map(r => 
          (r.id === request.id && r.userId === request.userId) 
            ? { ...r, status: 'rejected' }
            : r
        ));
        
        // Immediately refresh requests for real-time update
        try {
          const requestsData = await fetchAllRequests();
          setRequests(requestsData);
        } catch (error) {
          console.error('Error refreshing requests:', error);
        }
        
        alert('Request rejected successfully!');
      } else {
        alert(response.message || 'Failed to reject request. Please try again.');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert(error.message || 'Failed to reject request. Please try again.');
    }
  };

  // Handle delete request
  const handleDeleteRequest = async (request) => {
    if (!confirm(`Are you sure you want to delete the rejected request for ${request.userInfo?.firstName} ${request.userInfo?.lastName}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await api.delete(`/api/accounts/client/users/${request.userId}/request/desk`);
      
      if (response.success) {
        // Immediately remove from UI (optimistic update)
        setRequests(prevRequests => prevRequests.filter(r => !(r.id === request.id && r.userId === request.userId)));
        
        // Immediately refresh requests for real-time update
        try {
          const requestsData = await fetchAllRequests();
          setRequests(requestsData);
        } catch (error) {
          console.error('Error refreshing requests:', error);
        }
        
        alert('Request deleted successfully!');
      } else {
        alert(response.message || 'Failed to delete request. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      alert(error.message || 'Failed to delete request. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDesk(null);
  };

  const handleSaveAssignment = async (deskTag, assignmentData) => {
    try {
      if (assignmentData === null) {
        // Delete assignment
        const response = await api.delete(`/api/desk-assignments/${deskTag}`);
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete assignment');
        }
        
        // Immediately remove from UI (optimistic update)
        setDeskAssignments(prevAssignments => {
          const updated = { ...prevAssignments };
          delete updated[deskTag];
          return updated;
        });
      } else {
        // Create or update assignment
        const assignmentPayload = {
          desk: deskTag,
          name: assignmentData.name,
          type: assignmentData.type,
          email: assignmentData.email || "",
          contactNumber: assignmentData.contactNumber || "",
          company: assignmentData.company || "",
          assignedAt: new Date().toISOString()
        };
        
        // Try to update first, if fails, create new
        let response = await api.put(`/api/desk-assignments/${deskTag}`, assignmentPayload).catch(() => null);
        
        if (!response || !response.success) {
          // Try creating new
          response = await api.post('/api/desk-assignments', assignmentPayload);
        }
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to save assignment');
        }
      }
      
      // Immediately refresh assignments for real-time update
      try {
        const assignmentsResponse = await api.get('/api/desk-assignments');
        if (assignmentsResponse.success && assignmentsResponse.data) {
          const assignments = {};
          assignmentsResponse.data.forEach((assignment) => {
            assignments[assignment.id] = assignment;
          });
          setDeskAssignments(assignments);
        }
      } catch (error) {
        console.error('Error refreshing assignments:', error);
      }
    } catch (error) {
      console.error("Error saving desk assignment:", error);
      throw error;
    }
  };

  // Convert deskAssignments object to array for list view
  const assignmentsList = Object.keys(deskAssignments).map(deskTag => ({
    deskTag,
    ...deskAssignments[deskTag]
  })).sort((a, b) => {
    const partA = a.deskTag.charAt(0);
    const partB = b.deskTag.charAt(0);
    if (partA !== partB) return partA.localeCompare(partB);
    const numA = parseInt(a.deskTag.slice(1)) || 0;
    const numB = parseInt(b.deskTag.slice(1)) || 0;
    return numA - numB;
  });

  return (
    <div className={`w-full relative transition-all duration-500 ease-out pb-8 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
                setSelectedPart(1);
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
      <div className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 xl:p-6 shadow-lg shadow-slate-800/5 border border-gray-200 transition-all duration-500 mb-6 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'}`} style={{ transitionDelay: '0.2s' }}>
        <div key={activeTab} className="animate-fadeIn">
          {activeTab === 'floor-plan' && (
            <FloorPlanView
              zoom={zoom}
              handleZoomIn={handleZoomIn}
              handleZoomOut={handleZoomOut}
              handleResetZoom={handleResetZoom}
              handleDeskClick={handleDeskClick}
              deskAssignments={deskAssignments}
              isLoaded={isLoaded}
            />
          )}
          {activeTab === 'by-part' && (
            <ByPartView
              selectedPart={selectedPart}
              setSelectedPart={setSelectedPart}
              partZoom={partZoom}
              handlePartZoomIn={handlePartZoomIn}
              handlePartZoomOut={handlePartZoomOut}
              handlePartResetZoom={handlePartResetZoom}
              handleDeskClick={handleDeskClick}
              deskAssignments={deskAssignments}
            />
          )}
          {activeTab === 'list' && (
            <ListView
              assignmentsList={assignmentsList}
              setSelectedDesk={setSelectedDesk}
              setShowModal={setShowModal}
              setSelectedUserInfo={setSelectedUserInfo}
              setShowUserInfoModal={setShowUserInfoModal}
            />
          )}
          {activeTab === 'requests' && (
            <RequestsView
              requests={requests}
              loadingRequests={loadingRequests}
              handleAcceptRequest={handleAcceptRequest}
              handleRejectRequest={handleRejectRequest}
              handleDeleteRequest={handleDeleteRequest}
            />
          )}
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
