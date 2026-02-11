import { getFirestore } from '../../../config/firebase.js';

// Get all support tickets
export const getAllTickets = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    console.log('[getAllTickets] Fetching all support tickets');

    const tickets = [];

    // Fetch tickets from support collection
    const ticketsSnapshot = await db
      .collection('support-tickets')
      .orderBy('createdAt', 'desc')
      .get();

    console.log(`[getAllTickets] Found ${ticketsSnapshot.docs.length} tickets`);

    for (const ticketDoc of ticketsSnapshot.docs) {
      const ticketData = ticketDoc.data();
      
      // Convert Firestore timestamps
      const createdAt = ticketData.createdAt?.toDate ? ticketData.createdAt.toDate() : new Date(ticketData.createdAt || Date.now());
      const updatedAt = ticketData.updatedAt?.toDate ? ticketData.updatedAt.toDate() : null;

      tickets.push({
        id: ticketDoc.id,
        ...ticketData,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt ? updatedAt.toISOString() : null
      });
    }

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
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    console.log('[getTicketStats] Fetching ticket statistics');

    // Fetch all tickets
    const ticketsSnapshot = await db
      .collection('support-tickets')
      .get();

    const tickets = ticketsSnapshot.docs.map(doc => doc.data());

    // Calculate statistics
    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length
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
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const { ticketId } = req.params;

    console.log('[getTicketById] Fetching ticket:', ticketId);

    const ticketDoc = await db
      .collection('support-tickets')
      .doc(ticketId)
      .get();

    if (!ticketDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const ticketData = ticketDoc.data();
    const createdAt = ticketData.createdAt?.toDate ? ticketData.createdAt.toDate() : new Date(ticketData.createdAt || Date.now());
    const updatedAt = ticketData.updatedAt?.toDate ? ticketData.updatedAt.toDate() : null;

    res.status(200).json({
      success: true,
      data: {
        id: ticketDoc.id,
        ...ticketData,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt ? updatedAt.toISOString() : null
      }
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
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

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

    const ticketRef = db
      .collection('support-tickets')
      .doc(ticketId);

    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Update ticket status
    await ticketRef.update({
      status,
      updatedAt: new Date()
    });

    console.log('[updateTicketStatus] Ticket status updated successfully');

    res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      data: {
        ticketId,
        status
      }
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
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const { ticketId } = req.params;
    const { message, adminName } = req.body;

    console.log('[addTicketReply] Adding reply to ticket:', ticketId);

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const ticketRef = db
      .collection('support-tickets')
      .doc(ticketId);

    const ticketDoc = await ticketRef.get();

    if (!ticketDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Add reply to replies subcollection
    const replyData = {
      message,
      adminName: adminName || 'Admin',
      isAdmin: true,
      createdAt: new Date()
    };

    await ticketRef
      .collection('replies')
      .add(replyData);

    // Update ticket's updatedAt timestamp
    await ticketRef.update({
      updatedAt: new Date()
    });

    console.log('[addTicketReply] Reply added successfully');

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: replyData
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
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    const { ticketId } = req.params;

    console.log('[getTicketReplies] Fetching replies for ticket:', ticketId);

    const repliesSnapshot = await db
      .collection('support-tickets')
      .doc(ticketId)
      .collection('replies')
      .orderBy('createdAt', 'asc')
      .get();

    const replies = [];
    repliesSnapshot.forEach(doc => {
      const data = doc.data();
      replies.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      });
    });

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
