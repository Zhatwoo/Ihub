// Upload service
// Business logic for file upload operations with Firebase Storage (primary) and local storage (fallback)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFirebaseStorage } from '../config/firebase.js';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if Firebase Storage is available
const isFirebaseStorageAvailable = () => {
  try {
    const storage = getFirebaseStorage();
    return storage !== null;
  } catch (error) {
    return false;
  }
};

export const uploadService = {
  async uploadFile(file, options = {}) {
    // Try Firebase Storage first
    if (isFirebaseStorageAvailable()) {
      try {
        return await this.uploadToFirebase(file, options);
      } catch (error) {
        console.warn('Firebase Storage upload failed, falling back to local storage:', error.message);
        // Fall through to local storage
      }
    }

    // Fallback to local storage
    return await this.uploadToLocal(file, options);
  },

  async uploadToFirebase(file, options = {}) {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage is not available');
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const fileName = `${timestamp}_${baseName}${ext}`;
    
    // Determine folder path (default to 'uploads')
    const folderPath = options.folder || 'uploads';
    const filePath = `${folderPath}/${fileName}`;

    // Get bucket reference - use storageBucket from config or construct from projectId
    const bucketName = options.bucketName || config.firebase.storageBucket || 
                       (config.firebase.projectId ? `${config.firebase.projectId}.appspot.com` : null);
    
    if (!bucketName) {
      throw new Error('Firebase Storage bucket name not configured');
    }
    
    const bucket = storage.bucket(bucketName);
    const fileRef = bucket.file(filePath);

    // Upload file buffer to Firebase Storage
    const stream = fileRef.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          ...options.metadata
        }
      },
      public: options.public !== false // Default to public
    });

    // Return promise that resolves when upload is complete
    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        reject(error);
      });

      stream.on('finish', async () => {
        try {
          // Make file publicly accessible if requested
          if (options.public !== false) {
            await fileRef.makePublic();
          }

          // Get public URL or generate signed URL
          let fileUrl;
          if (options.public !== false) {
            fileUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;
          } else {
            // Generate signed URL (valid for 1 year)
            const [url] = await fileRef.getSignedUrl({
              action: 'read',
              expires: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
            });
            fileUrl = url;
          }

          resolve({
            path: filePath,
            url: fileUrl,
            filename: fileName,
            originalName: file.originalname,
            size: file.size,
            contentType: file.mimetype,
            storageType: 'firebase'
          });
        } catch (error) {
          reject(error);
        }
      });

      // Write file buffer to stream
      stream.end(file.buffer);
    });
  },

  async uploadToLocal(file, options = {}) {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const fileName = `${timestamp}_${baseName}${ext}`;

    // Determine folder path (default to 'uploads')
    const folderPath = options.folder || 'uploads';
    const uploadsDir = path.join(__dirname, '..', folderPath);
    
    // Ensure directory exists
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    const filePath = path.join(uploadsDir, fileName);
    const relativePath = `/${folderPath}/${fileName}`;

    // Save file to disk
    await fs.writeFile(filePath, file.buffer);

    // Generate URL - files will be served from /uploads path
    const API_URL = process.env.API_URL || 'http://localhost:5000';
    const fileUrl = `${API_URL}${relativePath}`;

    return {
      path: relativePath,
      url: fileUrl,
      filename: fileName,
      originalName: file.originalname,
      size: file.size,
      contentType: file.mimetype,
      storageType: 'local'
    };
  },

  async deleteFile(filePath, storageType = null) {
    // If storageType is not provided, try to detect from filePath
    if (!storageType) {
      // Firebase Storage paths typically don't start with /uploads
      // Local paths typically start with /uploads
      if (filePath.startsWith('/uploads/') || filePath.startsWith('uploads/')) {
        storageType = 'local';
      } else {
        // Try Firebase first, then fallback to local
        storageType = isFirebaseStorageAvailable() ? 'firebase' : 'local';
      }
    }

    if (storageType === 'firebase' && isFirebaseStorageAvailable()) {
      try {
        return await this.deleteFromFirebase(filePath);
      } catch (error) {
        console.warn('Firebase Storage delete failed, trying local storage:', error.message);
        // Fall through to local storage
      }
    }

    // Fallback to local storage
    return await this.deleteFromLocal(filePath);
  },

  async deleteFromFirebase(filePath) {
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error('Firebase Storage is not available');
    }

    const bucketName = config.firebase.storageBucket || 
                       (config.firebase.projectId ? `${config.firebase.projectId}.appspot.com` : null);
    
    if (!bucketName) {
      throw new Error('Firebase Storage bucket name not configured');
    }
    
    const bucket = storage.bucket(bucketName);
    const fileRef = bucket.file(filePath);

    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return false;
    }

    // Delete file
    await fileRef.delete();
    return true;
  },

  async deleteFromLocal(filePath) {
    try {
      // Parse file path (expects format like '/uploads/filename.jpg')
      // Remove leading slash and resolve to backend/uploads directory
      const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const fullPath = path.join(__dirname, '..', relativePath);

      // Check if file exists
      try {
        await fs.access(fullPath);
      } catch {
        return false; // File doesn't exist
      }

      // Delete file
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  },

  async validateFile(file, allowedTypes = [], maxSize = 10 * 1024 * 1024) {
    // Validate file size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    // Validate file type if allowedTypes is provided
    if (allowedTypes.length > 0) {
      const ext = path.extname(file.originalname).toLowerCase().slice(1);
      const mimetype = file.mimetype;
      
      const isAllowed = allowedTypes.some(type => {
        return ext === type.toLowerCase() || mimetype.includes(type.toLowerCase());
      });

      if (!isAllowed) {
        throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      }
    }

    return true;
  }
};
