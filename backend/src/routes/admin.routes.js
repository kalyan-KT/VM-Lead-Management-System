const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getUsers,
    createUser,
    getUser,
    updateUser,
    resetPassword,
    disableUser,
    enableUser
} = require('../controllers/admin.controller');
const requireAuth = require('../middleware/auth.middleware');

// Protect all admin routes
router.use(requireAuth);

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.post('/users', createUser);

// User Detail & Management
router.get('/users/:userId', getUser);
router.patch('/users/:userId', updateUser);
router.post('/users/:userId/reset-password', resetPassword);
router.post('/users/:userId/disable', disableUser);
router.post('/users/:userId/enable', enableUser);

module.exports = router;
