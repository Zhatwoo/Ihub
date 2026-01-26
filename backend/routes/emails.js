// Email routes
import express from 'express';
import {
  sendContactEmail,
  sendInquiryEmail,
  sendScheduleEmail
} from '../controllers/emailController.js';

const router = express.Router();

// Health check for email routes
router.get('/', (req, res) => {
  res.json({
    message: 'Email routes are active',
    endpoints: [
      'POST /api/emails/contact',
      'POST /api/emails/inquiry',
      'POST /api/emails/schedule'
    ]
  });
});

// POST /api/emails/contact - Send contact form email
router.post('/contact', sendContactEmail);

// POST /api/emails/inquiry - Send virtual office inquiry email
router.post('/inquiry', sendInquiryEmail);

// POST /api/emails/schedule - Send meeting schedule request email
router.post('/schedule', sendScheduleEmail);

console.log('✅ Email routes registered: /api/emails/contact, /api/emails/inquiry, /api/emails/schedule');

export default router;
