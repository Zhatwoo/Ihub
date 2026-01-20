import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middlewares/auth.js';
import { uploadFile } from '../controllers/uploadController.js';

const router = express.Router();

// Configure multer for file uploads using memory storage
// This allows us to choose between Firebase Storage (requires buffer) or local storage
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Configure allowed file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: jpeg, jpg, png, gif, pdf, doc, docx'));
    }
  }
});

// POST /api/upload - Upload file (authenticated)
router.post('/', authenticate, upload.single('file'), uploadFile);

export default router;
