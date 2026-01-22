'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

const PrivateOfficeContext = createContext();

export function PrivateOfficeProvider({ children }) {
  const [rooms, setRooms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch all data - no dependencies to avoid infinite loops
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [roomsRes, requestsRes, dashboardRes] = await Promise.all([
        api.get('/api/rooms'),
        api.get('/api/admin/private-office/requests?status=all'),
        api.get('/api/admin/private-office/dashboard')
      ]);

      if (roomsRes.success && roomsRes.data) {
        setRooms(roomsRes.data);
      }
      if (requestsRes.success && requestsRes.data) {
        setRequests(requestsRes.data.requests || []);
      }
      if (dashboardRes.success && dashboardRes.data) {
        setStats(dashboardRes.data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
      }
    } catch (error) {
      console.error('Error fetching private office data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch - only run once on mount
  useEffect(() => {
    fetchAllData();
  }, []); // Empty dependency array - only run on mount

  // Refresh all data
  const refreshData = useCallback(async () => {
    await fetchAllData();
  }, [fetchAllData]);

  // Add room
  const addRoom = useCallback(async (roomData) => {
    try {
      const response = await api.post('/api/rooms', roomData);
      if (response.success) {
        // Refresh all data
        await fetchAllData();
        return response;
      }
      return response;
    } catch (error) {
      console.error('Error adding room:', error);
      throw error;
    }
  }, [fetchAllData]);

  // Update room
  const updateRoom = useCallback(async (roomId, roomData) => {
    try {
      const response = await api.put(`/api/rooms/${roomId}`, roomData);
      if (response.success) {
        // Refresh all data
        await fetchAllData();
      }
      return response;
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  }, [fetchAllData]);

  // Delete room
  const deleteRoom = useCallback(async (roomId) => {
    try {
      const response = await api.delete(`/api/rooms/${roomId}`);
      if (response.success) {
        // Refresh all data
        await fetchAllData();
      }
      return response;
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }, [fetchAllData]);

  // Remove tenant
  const removeTenant = useCallback(async (roomId) => {
    try {
      const response = await api.put(`/api/admin/private-office/rooms/${roomId}/remove-tenant`, {});
      if (response.success) {
        // Refresh all data
        await fetchAllData();
      }
      return response;
    } catch (error) {
      console.error('Error removing tenant:', error);
      throw error;
    }
  }, [fetchAllData]);

  // Update request status
  const updateRequestStatus = useCallback(async (requestId, status) => {
    try {
      const response = await api.put(`/api/admin/private-office/requests/${requestId}/status`, { status });
      if (response.success) {
        // Refresh all data
        await fetchAllData();
      }
      return response;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }, [fetchAllData]);

  const value = {
    rooms,
    requests,
    stats,
    loading,
    refreshData,
    addRoom,
    updateRoom,
    deleteRoom,
    removeTenant,
    updateRequestStatus
  };

  return (
    <PrivateOfficeContext.Provider value={value}>
      {children}
    </PrivateOfficeContext.Provider>
  );
}

export function usePrivateOffice() {
  const context = useContext(PrivateOfficeContext);
  if (!context) {
    throw new Error('usePrivateOffice must be used within PrivateOfficeProvider');
  }
  return context;
}
