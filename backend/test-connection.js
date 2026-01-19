/**
 * Simple script to test if backend server is running
 * Run this with: node test-connection.js
 */

const PORT = process.env.PORT || 5000;
const BACKEND_URL = `http://localhost:${PORT}`;

async function testBackend() {
  console.log(`🔍 Checking if backend is running on ${BACKEND_URL}...\n`);

  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is RUNNING!\n');
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log(`\n📍 Available endpoints:`);
      console.log(`   - Health: ${BACKEND_URL}/health`);
      console.log(`   - API Info: ${BACKEND_URL}/api`);
      return true;
    } else {
      console.log('❌ Backend responded but with error status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend is NOT running or not accessible\n');
    console.log('Error:', error.message);
    console.log(`\n💡 Make sure you've started the backend with:`);
    console.log(`   cd backend && npm run dev`);
    return false;
  }
}

testBackend().then(success => {
  process.exit(success ? 0 : 1);
});
