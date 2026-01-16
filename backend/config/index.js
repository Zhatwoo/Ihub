// Configuration exports
// Central export point for all configuration

export { config } from './env.js';
export { initDatabase, getDatabase } from './database.js';
export { 
  initFirebase, 
  getFirebaseAuth, 
  getFirestore, 
  getFirebaseStorage 
} from './firebase.js';
