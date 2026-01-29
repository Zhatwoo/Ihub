// Test script to manually create a bill for virtual office client
import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
let firestore = null;

try {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    
    if (!projectId || !privateKey || !clientEmail) {
      console.error('❌ Firebase credentials not set in .env');
      process.exit(1);
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail
      })
    });
    
    firestore = admin.firestore();
    console.log('✅ Firebase initialized successfully');
  } else {
    firestore = admin.firestore();
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  process.exit(1);
}

const createBillForClient = async (clientId) => {
  try {
    console.log(`🔄 Creating bill for virtual office client: ${clientId}`);
    
    // Get client data
    const clientDoc = await firestore.collection('virtual-office-clients').doc(clientId).get();
    
    if (!clientDoc.exists) {
      console.error(`❌ Client ${clientId} not found`);
      return;
    }
    
    const clientData = clientDoc.data();
    console.log(`✅ Found client:`, clientData);
    
    // Create bill
    const billRef = firestore
      .collection('virtual-office-clients')
      .doc(clientId)
      .collection('bills')
      .doc();
    
    const startDate = new Date();
    
    const billData = {
      clientName: clientData.fullName || 'N/A',
      companyName: clientData.company || 'N/A',
      email: clientData.email || 'N/A',
      contactNumber: clientData.phoneNumber || 'N/A',
      serviceType: 'virtual-office',
      assignedResource: clientData.package || clientData.plan || 'Virtual Office',
      amount: 0,
      cusaFee: 0,
      parkingFee: 0,
      lateFee: 0,
      damageFee: 0,
      feePeriod: null,
      startDate: admin.firestore.Timestamp.fromDate(startDate),
      dueDate: null,
      status: 'unpaid',
      clientId: clientId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    console.log(`📝 Bill data:`, billData);
    
    await billRef.set(billData);
    
    console.log(`✅ Bill created successfully at /virtual-office-clients/${clientId}/bills/${billRef.id}`);
    
    // Verify it was created
    const verifyDoc = await billRef.get();
    if (verifyDoc.exists) {
      console.log(`✅ Verified bill exists:`, verifyDoc.data());
    } else {
      console.error(`❌ Bill was not created!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('❌ Stack:', error.stack);
  }
  
  process.exit(0);
};

// Use the client ID from your Firestore - let's first list all clients
const listClients = async () => {
  try {
    console.log('📋 Listing all virtual office clients...');
    const snapshot = await firestore.collection('virtual-office-clients').get();
    
    if (snapshot.empty) {
      console.log('❌ No virtual office clients found');
      return null;
    }
    
    console.log(`✅ Found ${snapshot.size} clients:`);
    snapshot.forEach(doc => {
      console.log(`  - ID: ${doc.id}`);
      console.log(`    Data:`, doc.data());
    });
    
    return snapshot.docs[0].id; // Return first client ID
  } catch (error) {
    console.error('❌ Error listing clients:', error);
    return null;
  }
};

// First list clients, then create bill for the first one
listClients().then(clientId => {
  if (clientId) {
    createBillForClient(clientId);
  } else {
    console.error('❌ No client found to create bill for');
    process.exit(1);
  }
});
