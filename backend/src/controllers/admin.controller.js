const Lead = require('../models/Lead');
const { clerkClient } = require('@clerk/clerk-sdk-node');

// Helper to verify Admin role securely
const verifyAdmin = async (userId) => {
    if (!userId) return false;
    try {
        const user = await clerkClient.users.getUser(userId);
        return user.publicMetadata?.role === 'admin';
    } catch (error) {
        console.error('Error verifying admin role:', error);
        return false;
    }
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
    try {
        const { userId } = req.auth;
        const isAdmin = await verifyAdmin(userId);

        if (!isAdmin) {
            return res.status(403).json({ message: 'Access denied: Admin privileges required.' });
        }

        // 1. Total Users
        const usersList = await clerkClient.users.getUserList();
        const totalUsers = usersList.length;

        // 2. Total Leads
        const totalLeads = await Lead.countDocuments({ archived: { $ne: true } });

        // 3. Leads Created Today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const leadsToday = await Lead.countDocuments({
            createdAt: { $gte: startOfDay },
            archived: { $ne: true }
        });

        // 4. Active Users (Users who created at least 1 lead)
        const activeUserIds = await Lead.distinct('createdBy');
        const activeUsersCount = activeUserIds.length;

        res.json({
            totalUsers,
            totalLeads,
            leadsToday,
            activeUsers: activeUsersCount
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Users with Stats
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
    try {
        const { userId } = req.auth;
        const isAdmin = await verifyAdmin(userId);

        if (!isAdmin) {
            return res.status(403).json({ message: 'Access denied: Admin privileges required.' });
        }

        // Get all users from Clerk
        const users = await clerkClient.users.getUserList({
            limit: 100,
        });

        // Get lead counts per user
        const leadCounts = await Lead.aggregate([
            { $group: { _id: "$createdBy", count: { $sum: 1 } } }
        ]);
        const countMap = {};
        leadCounts.forEach(item => {
            if (item._id) countMap[item._id] = item.count;
        });

        // Format response
        const userList = users.map(user => {
            const uId = user.id;
            // Handle different email structures if needed, usually emailAddresses array
            const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || user.emailAddresses[0]?.emailAddress;
            const role = user.publicMetadata?.role || 'user';

            return {
                id: uId,
                email: primaryEmail,
                role: role,
                totalLeads: countMap[uId] || 0,
                status: 'Active',
                createdAt: user.createdAt
            };
        });

        res.json(userList);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new User
// @route   POST /api/admin/users
// @access  Private (Admin only)
exports.createUser = async (req, res) => {
    try {
        const { userId } = req.auth;
        const isAdmin = await verifyAdmin(userId);

        if (!isAdmin) {
            return res.status(403).json({ message: 'Access denied: Admin privileges required.' });
        }

        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Create user in Clerk
        const user = await clerkClient.users.createUser({
            emailAddress: [email],
            password: password,
            publicMetadata: {
                role: role || 'user'
            },
            skipPasswordChecks: false, // Enforce strong passwords
        });

        res.status(201).json({
            id: user.id,
            email: user.emailAddresses[0].emailAddress,
            role: user.publicMetadata.role,
            message: 'User created successfully'
        });

    } catch (error) {
        console.error('Error creating user:', error);
        // Handle Clerk specific errors
        if (error.errors && error.errors.length > 0) {
            return res.status(400).json({ message: error.errors[0].message });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Single User
// @route   GET /api/admin/users/:userId
// @access  Private (Admin only)
exports.getUser = async (req, res) => {
    try {
        const { userId: adminId } = req.auth;
        const isAdmin = await verifyAdmin(adminId);
        if (!isAdmin) return res.status(403).json({ message: 'Access denied' });

        const user = await clerkClient.users.getUser(req.params.userId);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update User (Profile & Role & Email)
// @route   PATCH /api/admin/users/:userId
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
    try {
        const { userId: adminId } = req.auth;
        const isAdmin = await verifyAdmin(adminId);
        if (!isAdmin) return res.status(403).json({ message: 'Access denied' });

        const { firstName, lastName, role, email } = req.body;
        const targetUserId = req.params.userId;

        let updateData = {
            firstName,
            lastName,
            publicMetadata: { role }
        };

        // Handle Email Change
        if (email) {
            const user = await clerkClient.users.getUser(targetUserId);
            const currentEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

            if (currentEmail !== email) {
                try {
                    // 1. Create new email (verified)
                    const newEmailObj = await clerkClient.emailAddresses.createEmailAddress({
                        userId: targetUserId,
                        emailAddress: email,
                        verified: true
                    });

                    // 2. Set as primary in the update payload
                    updateData.primaryEmailAddressId = newEmailObj.id;

                    // Note: We are keeping the old email as secondary. 
                    // This is safer than deleting it immediately.
                } catch (emailError) {
                    console.error("Email update failed:", emailError);
                    if (emailError.errors && emailError.errors[0]?.code === 'form_identifier_exists') {
                        return res.status(400).json({ message: 'Email already exists' });
                    }
                    return res.status(400).json({ message: 'Failed to update email: ' + (emailError.message || 'Unknown error') });
                }
            }
        }

        const updatedUser = await clerkClient.users.updateUser(targetUserId, updateData);
        res.json(updatedUser);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset User Password
// @route   POST /api/admin/users/:userId/reset-password
// @access  Private (Admin only)
exports.resetPassword = async (req, res) => {
    try {
        const { userId: adminId } = req.auth;
        const isAdmin = await verifyAdmin(adminId);
        if (!isAdmin) return res.status(403).json({ message: 'Access denied' });

        const { password } = req.body;
        if (!password || password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 chars' });
        }

        const user = await clerkClient.users.updateUser(req.params.userId, {
            password: password
        });
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Disable User
// @route   POST /api/admin/users/:userId/disable
// @access  Private (Admin only)
exports.disableUser = async (req, res) => {
    try {
        const { userId: adminId } = req.auth;
        // Check if disabling self
        if (adminId === req.params.userId) {
            return res.status(400).json({ message: 'You cannot disable yourself' });
        }

        const isAdmin = await verifyAdmin(adminId);
        if (!isAdmin) return res.status(403).json({ message: 'Access denied' });

        await clerkClient.users.banUser(req.params.userId); // 'ban' is effective disable in Clerk
        res.json({ message: 'User disabled successfully' });
    } catch (error) {
        console.error('Disable user error:', error);
        res.status(500).json({ message: error.message });
    }
};


// @route   POST /api/admin/users/:userId/enable
// @access  Private (Admin only)
exports.enableUser = async (req, res) => {
    try {
        const { userId: adminId } = req.auth;
        const isAdmin = await verifyAdmin(adminId);
        if (!isAdmin) return res.status(403).json({ message: 'Access denied' });

        await clerkClient.users.unbanUser(req.params.userId);
        res.json({ message: 'User enabled successfully' });
    } catch (error) {
        console.error('Enable user error:', error);
        res.status(500).json({ message: error.message });
    }
};
