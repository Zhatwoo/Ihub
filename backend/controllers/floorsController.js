// Floors controller
// Handles floor management operations using Firestore

import { floorService } from '../services/floorService.js';
import { sendFirestoreError } from '../utils/firestoreHelper.js';

/**
 * Get all floors
 */
export const getAllFloors = async (req, res) => {
  try {
    const floors = await floorService.getAllFloors();

    res.json({
      success: true,
      data: floors
    });
  } catch (error) {
    console.error('Get all floors error:', error);
    
    // Check if Firestore is not initialized
    if (error.message && error.message.includes('not initialized')) {
      return sendFirestoreError(res);
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch floors'
    });
  }
};

/**
 * Get floor by ID
 */
export const getFloorById = async (req, res) => {
  try {
    const { floorId } = req.params;
    const floor = await floorService.getFloorById(floorId);

    if (!floor) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Floor not found'
      });
    }

    res.json({
      success: true,
      data: floor
    });
  } catch (error) {
    console.error('Get floor by ID error:', error);
    
    if (error.message && error.message.includes('not initialized')) {
      return sendFirestoreError(res);
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to fetch floor'
    });
  }
};

/**
 * Create new floor
 */
export const createFloor = async (req, res) => {
  try {
    const floorData = req.body;
    const newFloor = await floorService.createFloor(floorData);

    res.status(201).json({
      success: true,
      message: 'Floor created successfully',
      data: newFloor
    });
  } catch (error) {
    console.error('Create floor error:', error);
    
    if (error.message && error.message.includes('not initialized')) {
      return sendFirestoreError(res);
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to create floor'
    });
  }
};

/**
 * Update floor
 */
export const updateFloor = async (req, res) => {
  try {
    const { floorId } = req.params;
    const updateData = req.body;
    const updatedFloor = await floorService.updateFloor(floorId, updateData);

    if (!updatedFloor) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Floor not found'
      });
    }

    res.json({
      success: true,
      message: 'Floor updated successfully',
      data: updatedFloor
    });
  } catch (error) {
    console.error('Update floor error:', error);
    
    if (error.message && error.message.includes('not initialized')) {
      return sendFirestoreError(res);
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to update floor'
    });
  }
};

/**
 * Delete floor
 */
export const deleteFloor = async (req, res) => {
  try {
    const { floorId } = req.params;
    const deleted = await floorService.deleteFloor(floorId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Floor not found'
      });
    }

    res.json({
      success: true,
      message: 'Floor deleted successfully'
    });
  } catch (error) {
    console.error('Delete floor error:', error);
    
    if (error.message && error.message.includes('not initialized')) {
      return sendFirestoreError(res);
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete floor'
    });
  }
};
