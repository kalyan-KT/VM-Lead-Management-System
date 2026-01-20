const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // Load env for this script

console.log('Secret Key present:', !!process.env.CLERK_SECRET_KEY);

try {
    const requireAuth = require('./src/middleware/auth.middleware');
    console.log('Middleware type:', typeof requireAuth);
    console.log('Middleware content:', requireAuth);
} catch (err) {
    console.error('Error importing middleware:', err);
}
