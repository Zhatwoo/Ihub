'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

// Custom hook to fetch private offices from backend API
export function usePrivateOffices() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        // Fetch both rooms and occupancy status in parallel
        const [roomsResponse, occupancyResponse] = await Promise.all([
          api.get('/api/rooms'),
          api.get('/api/schedules/occupancy').catch((error) => {
            // If occupancy check fails, log warning but continue (won't filter any rooms)
            console.warn('Could not fetch room occupancy status:', error.message);
            return { success: false, data: { occupiedRoomIds: [], occupiedRoomNames: [] } };
          })
        ]);

        if (roomsResponse.success && roomsResponse.data) {
          // Get occupied room IDs and names from occupancy endpoint
          const occupiedRoomIds = new Set();
          const occupiedRoomNames = new Set();

          if (occupancyResponse.success && occupancyResponse.data) {
            // Backend already processed all schedules and returns occupied rooms
            (occupancyResponse.data.occupiedRoomIds || []).forEach(id => occupiedRoomIds.add(id));
            (occupancyResponse.data.occupiedRoomNames || []).forEach(name => occupiedRoomNames.add(name));
          }

          // Filter out occupied rooms and map remaining rooms
          const roomsData = roomsResponse.data
            .filter(room => {
              // Check if room status is explicitly marked as "Occupied" by admin
              const isOccupiedByStatus = room.status === 'Occupied';
              
              // Check schedule-based occupancy
              const isOccupiedById = occupiedRoomIds.has(room.id);
              const roomNameLower = room.name ? room.name.toLowerCase().trim() : '';
              const isOccupiedByName = roomNameLower && occupiedRoomNames.has(roomNameLower);
              
              // Also check for partial name matches
              let partialNameMatch = false;
              if (roomNameLower) {
                for (const occupiedName of occupiedRoomNames) {
                  if (roomNameLower.includes(occupiedName) || occupiedName.includes(roomNameLower)) {
                    partialNameMatch = true;
                    break;
                  }
                }
              }
              
              // Filter out if occupied by status OR by schedule
              return !isOccupiedByStatus && !isOccupiedById && !isOccupiedByName && !partialNameMatch;
            })
            .map(room => ({
              id: room.id,
              name: room.name || 'Private Office',
              title: room.name || 'Private Office',
              description: room.inclusions || 'Modern, well-equipped private office designed for productivity and comfort.',
              image: room.image || '/images/inspirelogo.png',
              rating: 4.95, // Default rating
              badge: 'Guest favorite',
              rentFee: room.rentFee || 0,
              currency: room.currency || 'PHP',
              rentFeePeriod: room.rentFeePeriod || 'per hour',
              inclusions: room.inclusions || ''
            }));
          
          setRooms(roomsData);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchRooms();
    
    // Poll for updates every 30 seconds
    // Only poll when tab is visible to reduce unnecessary requests
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Only create interval if one doesn't already exist
        if (!intervalRef.current) {
          fetchRooms(); // Fetch immediately when tab becomes visible
          intervalRef.current = setInterval(fetchRooms, 30000);
        }
      }
    };
    
    // Start polling if tab is visible (only if no interval exists)
    if (!document.hidden && !intervalRef.current) {
      intervalRef.current = setInterval(fetchRooms, 30000);
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { rooms, loading };
}

// Export for backward compatibility (if needed)
export const whyChooseFeatures = [];

