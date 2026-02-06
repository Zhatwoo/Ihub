// TODO: Remove this import when Firestore is configured
// import { getFirestore } from '../../../config/firebase.js';

// Get all support tickets
export const getAllTickets = async (req, res) => {
  try {
    console.log('[getAllTickets] Fetching all support tickets');

    // TODO: Connect to Firestore later
    // For now, return empty array
    const tickets = [];

    console.log(`[getAllTickets] Returning ${tickets.length} tickets`);

    res.status(200).json({
      success: true,
      data: tickets
    });
  } catch (error) {
    console.error('[getAllTickets] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets',
      error: error.message
    });
  }
};

// Get support ticket statistics
export const getTicketStats = async (req, res) => {
  try {
    console.log('[getTicketStats] Fetching ticket statistics');

    // TODO: Connect to Firestore later
    // For now, return zero stats
    const stats = {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0
    };

    console.log('[getTicketStats] Stats:', stats);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[getTicketStats] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket statistics',
      error: error.message
    });
  }
};

// Get single ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;

    console.log('[getTicketById] Fetching ticket:', ticketId);

    // TODO: Connect to Firestore later
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

// Update ticket status
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    console.log('[updateTicketStatus] Updating ticket:', ticketId, 'to status:', status);

    // Validate status
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: open, in-progress, resolved, closed'
      });
    }

    // TODO: Connect to Firestore later
    // For now, return not found
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  } catch (error) {
    console.error('[updateTicketStatus] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket status',
      error: error.message
    });
  }
};

// Add reply to ticket
export const addTicketReply = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, adminName } = req.body;

    console.log('[addTicketReply] Adding reply to ticket:', ticketId);

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // TODO: Connect to Firestore later
    // For now, return not found
    return res.status(404).json({
      success: false,
      message: 'Ticket not found'
    });
  } catch (error) {
    console.error('[addTicketReply] Error:', error);
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

    // TODO: Connect to Firestore later
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
