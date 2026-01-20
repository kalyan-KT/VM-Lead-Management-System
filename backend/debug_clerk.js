const clerk = require('@clerk/clerk-sdk-node');
console.log('Clerk Exports:', Object.keys(clerk));
console.log('ClerkExpressRequireAuth type:', typeof clerk.ClerkExpressRequireAuth);
