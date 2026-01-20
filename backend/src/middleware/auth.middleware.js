const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Wrapper to debug authentication
const clerkAuth = ClerkExpressRequireAuth();

const requireAuth = (req, res, next) => {
    clerkAuth(req, res, (err) => {
        if (err) {
            console.error('[Auth] Clerk Middleware Error:', err);
            return next(err);
        }
        next();
    });
};

module.exports = requireAuth;
