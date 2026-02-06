import { getFirestore } from '../../../config/firebase.js';

// Get current logged-in user's profile information
export const getCurrentUserProfile = async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Firestore not initialized'
      });
    }

    // Get user ID from authenticated request (set by authenticate middleware)
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    console.log('[getCurrentUserProfile] Fetching profile for user:', userId);

    // Try to fetch from client users first
    let userDoc = await db
      .collection('accounts')
      .doc('client')
      .collection('users')
      .doc(userId)
      .get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      
      return res.status(200).json({
        success: true,
        data: {
          userId: userId,
          name: userData.name || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : 'N/A'),
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || req.user.email || 'N/A',
          contactNumber: userData.contactNumber || userData.contact || 'N/A',
          companyName: userData.companyName || 'N/A',
          userType: 'client'
        }
      });
    }

    // If not found in client users, try virtual office tenants
    userDoc = await db
      .collection('accounts')
      .doc('virtual-tenants')
      .collection('tenants')
      .doc(userId)
      .get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      
      return res.status(200).json({
        success: true,
        data: {
          userId: userId,
          name: userData.fullName || 'N/A',
          email: userData.email || req.user.email || 'N/A',
          contactNumber: userData.phoneNumber || 'N/A',
          companyName: userData.company || 'N/A',
          userType: 'virtual-office'
        }
      });
    }

    // User not found in Firestore but authenticated - return basic info from token
    console.log('[getCurrentUserProfile] User not found in Firestore, returning token data');
    return res.status(200).json({
      success: true,
      data: {
        userId: userId,
        name: 'N/A',
        email: req.user.email || 'N/A',
        contactNumber: 'N/A',
        companyName: 'N/A',
        userType: 'client'
      }
    });

  } catch (error) {
    console.error('[getCurrentUserProfile] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};
