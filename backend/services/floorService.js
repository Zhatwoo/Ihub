// Floor service
// Business logic for floor operations using Firestore

import { getFirestore } from '../config/firebase.js';
import admin from 'firebase-admin';

export const floorService = {
  async getAllFloors() {
    const firestore = getFirestore();
    
    if (!firestore) {
      throw new Error('Firestore is not initialized');
    }
    
    // Fetch all floors from Firestore
    const floorsSnapshot = await firestore.collection('floors').get();
    
    // Map all floors and filter out deleted/hidden ones
    const floors = floorsSnapshot.docs
      .map(doc => {
        const floorData = doc.data();
        return {
          id: doc.id,
          ...floorData
        };
      })
      .filter(floor => {
        const status = floor.status?.toLowerCase();
        const visible = floor.visible !== false; // Default to true if not set
        const isDeleted = status === 'deleted' || status === 'hidden';
        
        return visible && !isDeleted;
      });

    return floors;
  },

  async getFloorById(id) {
    const firestore = getFirestore();
    
    if (!firestore) {
      throw new Error('Firestore is not initialized');
    }
    
    const floorDoc = await firestore.collection('floors').doc(id).get();

    if (!floorDoc.exists) {
      return null;
    }

    return {
      id: floorDoc.id,
      ...floorDoc.data()
    };
  },

  async createFloor(floorData) {
    const firestore = getFirestore();
    
    if (!firestore) {
      throw new Error('Firestore is not initialized');
    }
    
    // Set defaults
    const floorDataWithDefaults = {
      ...floorData,
      visible: true,
      status: floorData.status || 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const floorRef = await firestore.collection('floors').add(floorDataWithDefaults);
    const newFloor = await floorRef.get();

    return {
      id: newFloor.id,
      ...newFloor.data()
    };
  },

  async updateFloor(id, floorData) {
    const firestore = getFirestore();
    
    if (!firestore) {
      throw new Error('Firestore is not initialized');
    }
    
    const floorRef = firestore.collection('floors').doc(id);
    const floorDoc = await floorRef.get();

    if (!floorDoc.exists) {
      return null;
    }

    const updateDataWithDefaults = {
      ...floorData,
      visible: floorData.visible !== undefined ? floorData.visible : true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await floorRef.update(updateDataWithDefaults);
    const updatedFloor = await floorRef.get();

    return {
      id: updatedFloor.id,
      ...updatedFloor.data()
    };
  },

  async deleteFloor(id) {
    const firestore = getFirestore();
    
    if (!firestore) {
      throw new Error('Firestore is not initialized');
    }
    
    const floorRef = firestore.collection('floors').doc(id);
    const floorDoc = await floorRef.get();

    if (!floorDoc.exists) {
      return false;
    }

    // Soft delete - set status to 'deleted'
    await floorRef.update({
      status: 'deleted',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return true;
  }
};
