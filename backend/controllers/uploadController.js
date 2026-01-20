// Upload controller
// Handles file upload operations with Firebase Storage (primary) and local storage (fallback)

import { uploadService } from '../services/uploadService.js';

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'Bad Request',
        message: 'No file uploaded' 
      });
    }

    // Validate file (multer already validated file type, but check size)
    const allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'pdf', 'doc', 'docx'];
    await uploadService.validateFile(req.file, allowedTypes, 10 * 1024 * 1024); // 10MB

    // Upload file - service will try Firebase Storage first, then fallback to local
    const result = await uploadService.uploadFile(req.file, {
      folder: 'uploads',
      public: true, // Make files publicly accessible
      metadata: {
        uploadedBy: req.user?.uid || 'unknown',
        uploadedAt: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      path: result.path, // Return path at top level for compatibility
      url: result.url,
      storageType: result.storageType, // 'firebase' or 'local'
      data: {
        path: result.path,
        url: result.url,
        filename: result.filename,
        originalName: result.originalName,
        size: result.size,
        storageType: result.storageType
      }
    });
  } catch (error) {
    console.error('Upload file error:', error);

    res.status(500).json({ 
      success: false,
      error: 'Upload failed', 
      message: error.message || 'An error occurred during file upload'
    });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { filePath, storageType } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'File path is required'
      });
    }

    // Delete file - service will try Firebase Storage first if storageType is 'firebase',
    // otherwise will try to detect or use local storage
    const deleted = await uploadService.deleteFile(filePath, storageType);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);

    res.status(500).json({
      success: false,
      error: 'Delete failed',
      message: error.message || 'An error occurred during file deletion'
    });
  }
};
