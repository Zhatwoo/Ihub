// Email Controller
// Handles sending emails via Resend API for contact forms, inquiries, and schedule requests

import { resend } from '../config/resend.js';
import { render } from '@react-email/render';
import ContactEmail from '../emails/ContactEmail.jsx';
import InquiryEmail from '../emails/InquiryEmail.jsx';
import ScheduleEmail from '../emails/ScheduleEmail.jsx';

// Recipient email address
const RECIPIENT_EMAIL = 'ndelatorre08252002@gmail.com';

/**
 * Send contact form email
 * POST /api/emails/contact
 */
export const sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Missing required fields: name, email, subject, and message are required'
      });
    }

    // Validate Resend is initialized
    if (!resend) {
      return res.status(500).json({
        success: false,
        error: 'Server Configuration Error',
        message: 'Email service is not configured. Please check RESEND_API_KEY in backend/.env file.'
      });
    }

    // Render email template
    let emailHtml;
    try {
      emailHtml = await render(
        ContactEmail({ name, email, phone, subject, message })
      );
    } catch (renderError) {
      console.error('Email render error:', renderError);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: `Failed to render email template: ${renderError.message}`
      });
    }

    // Send email via Resend
    try {
      const data = await resend.emails.send({
        from: 'Contact Form <onboarding@resend.dev>', // Update with your verified domain
        to: [RECIPIENT_EMAIL],
        replyTo: email,
        subject: `Contact Us: ${subject}`,
        html: emailHtml,
      });

      res.json({
        success: true,
        message: 'Contact form submitted successfully. We will get back to you soon.',
        data
      });
    } catch (sendError) {
      console.error('Resend send error:', sendError);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: `Failed to send email: ${sendError.message}`
      });
    }
  } catch (error) {
    console.error('Contact email controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to process contact form submission'
    });
  }
};

/**
 * Send virtual office inquiry email
 * POST /api/emails/inquiry
 */
export const sendInquiryEmail = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, company, position, preferredStartDate } = req.body;

    // Validate required fields
    if (!fullName || !email || !phoneNumber || !preferredStartDate) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Missing required fields: fullName, email, phoneNumber, and preferredStartDate are required'
      });
    }

    // Validate Resend is initialized
    if (!resend) {
      return res.status(500).json({
        success: false,
        error: 'Server Configuration Error',
        message: 'Email service is not configured. Please check RESEND_API_KEY in backend/.env file.'
      });
    }

    // Render email template
    let emailHtml;
    try {
      emailHtml = await render(
        InquiryEmail({ 
          fullName,
          email,
          phoneNumber,
          company,
          position,
          preferredStartDate
        })
      );
    } catch (renderError) {
      console.error('Email render error:', renderError);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: `Failed to render email template: ${renderError.message}`
      });
    }

    // Send email via Resend
    try {
      const data = await resend.emails.send({
        from: 'Virtual Office Inquiry <onboarding@resend.dev>', // Update with your verified domain
        to: [RECIPIENT_EMAIL],
        replyTo: email,
        subject: `New Virtual Office Inquiry from ${fullName}`,
        html: emailHtml,
      });

      res.json({
        success: true,
        message: 'Inquiry submitted successfully. We will contact you soon.',
        data
      });
    } catch (sendError) {
      console.error('Resend send error:', sendError);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: `Failed to send email: ${sendError.message}`
      });
    }
  } catch (error) {
    console.error('Inquiry email controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to process inquiry submission'
    });
  }
};

/**
 * Send schedule meeting request email
 * POST /api/emails/schedule
 */
export const sendScheduleEmail = async (req, res) => {
  try {
    const { fullName, email } = req.body;

    // Validate required fields
    if (!fullName || !email) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Missing required fields: fullName and email are required'
      });
    }

    // Validate Resend is initialized
    if (!resend) {
      return res.status(500).json({
        success: false,
        error: 'Server Configuration Error',
        message: 'Email service is not configured. Please check RESEND_API_KEY in backend/.env file.'
      });
    }

    // Render email template
    let emailHtml;
    try {
      emailHtml = await render(
        ScheduleEmail({ fullName, email })
      );
    } catch (renderError) {
      console.error('Email render error:', renderError);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: `Failed to render email template: ${renderError.message}`
      });
    }

    // Send email via Resend
    try {
      const data = await resend.emails.send({
        from: 'Meeting Schedule <onboarding@resend.dev>', // Update with your verified domain
        to: [RECIPIENT_EMAIL],
        replyTo: email,
        subject: 'Meeting Schedule Request',
        html: emailHtml,
      });

      res.json({
        success: true,
        message: 'Schedule request submitted successfully. We will contact you soon to schedule a meeting.',
        data
      });
    } catch (sendError) {
      console.error('Resend send error:', sendError);
      return res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: `Failed to send email: ${sendError.message}`
      });
    }
  } catch (error) {
    console.error('Schedule email controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message || 'Failed to process schedule request'
    });
  }
};
