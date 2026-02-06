import { getFirestore } from '../../../config/firebase.js';
import admin from 'firebase-admin';

// Create a new support ticket
export const createTicket = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const {
      clientName,
      companyName,
      contactNumber,
      email,
      subject,
      message,
      priority,
      status
    } = req.body;

    console.log('[createTicket] Creating new ticket:', { clientName, subject, priority });

    // Validate required fields
    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    // Get user ID from authenticated request (set by authenticate middleware)
    const userId = req.user?.uid;

    // Create ticket in Firestore
    const ticketData = {
      userId: userId || null,
      clientName: clientName || 'N/A',
      companyName: companyName || 'N/A',
      contactNumber: contactNumber || 'N/A',
      email: email || req.user?.email || 'N/A',
      subject,
      message,
      priority: priority || 'medium',
      status: status || 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const ticketRef = await db
      .collection('support-tickets')
      .add(ticketData);

    console.log('[createTicket] Ticket created successfully:', ticketRef.id);

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: {
        ticketId: ticketRef.id,
        status: 'open'
      }
    });
  } catch (error) {
    console.error('[createTicket] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      error: error.message
    });
  }
};

// Get all tickets for a specific user
export const getUserTickets = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('[getUserTickets] Fetching tickets for user:', userId);

    // TODO: Add Firestore logic to fetch user tickets
    // For now, return empty array
    const tickets = [];

    console.log(`[getUserTickets] Found ${tickets.length} tickets`);

    res.status(200).json({
      success: true,
      data: tickets
    });
  } catch (error) {
    console.error('[getUserTickets] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message
    });
  }
};

// Get single ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;

    console.log('[getTicketById] Fetching ticket:', ticketId);

    // TODO: Add Firestore logic to fetch ticket
    // For now, return not found
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  } catch (error) {
    console.error('[getTicketById] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message
    });
  }
};

// Add a reply to ticket (from client side)
export const addClientReply = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    console.log('[addClientReply] Adding reply to ticket:', ticketId);

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // TODO: Add Firestore logic to add reply
    // For now, return not found
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  } catch (error) {
    console.error('[addClientReply] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reply',
      error: error.message
    });
  }
};

// Get ticket replies
export const getTicketReplies = async (req, res) => {
  try {
    const { ticketId } = req.params;

    console.log('[getTicketReplies] Fetching replies for ticket:', ticketId);

    // TODO: Add Firestore logic to fetch replies
    // For now, return empty array
    const replies = [];

    console.log(`[getTicketReplies] Found ${replies.length} replies`);

    res.status(200).json({
      success: true,
      data: replies
    });
  } catch (error) {
    console.error('[getTicketReplies] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch replies',
      error: error.message
    });
  }
};
