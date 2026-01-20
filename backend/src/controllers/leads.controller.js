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

// @desc    Get all leads (Admin sees all, User sees own)
// @route   GET /api/leads
// @access  Private
exports.getLeads = async (req, res) => {
    try {
        const { userId, sessionClaims } = req.auth;
        // Verify admin status robustly
        let isAdmin = sessionClaims?.metadata?.role === 'admin';

        // If critical operation or doubt, double check with Clerk API
        // For 'view all', we can be stricter or trust the token. 
        // Token might be stale. Let's do a double check if token says NO but we suspect something? 
        // No, better to trust token for speed, BUT use verifyAdmin if we want to be 100% sure about permissions.
        // Given the bug, let's use verifyAdmin to be sure. It adds latency but fixes the "Stale Token" bug.
        // Optimization: user verifyAdmin only if sessionClaims doesn't have it? 
        // Or just use verifyAdmin always for now to fix the bug.

        // Actually, if sessionClaims is OLD, it won't have the role.
        if (!isAdmin) {
            isAdmin = await verifyAdmin(userId);
        }

        let query = {};
        if (!isAdmin) {
            query.createdBy = userId;
        }

        const leads = await Lead.find(query).sort({ createdAt: -1 });
        res.status(200).json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Private
// @desc    Create a new lead
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res) => {
    try {
        const { userId } = req.auth;

        const leadData = {
            ...req.body,
            createdBy: userId,
        };

        const lead = await Lead.create(leadData);
        res.status(201).json(lead);
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
exports.getLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        // Access control
        const { userId, sessionClaims } = req.auth;
        const isAdmin = sessionClaims?.metadata?.role === 'admin';

        if (!isAdmin && lead.createdBy && lead.createdBy !== userId) {
            return res.status(403).json({ message: 'Not authorized to view this lead' });
        }

        res.status(200).json(lead);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res) => {
    try {
        // Check ownership before update
        const existingLead = await Lead.findById(req.params.id);
        if (!existingLead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        const { userId, sessionClaims } = req.auth;
        let isAdmin = sessionClaims?.metadata?.role === 'admin';

        // Check fresh verification if token says not admin
        if (!isAdmin) {
            isAdmin = await verifyAdmin(userId);
        }

        if (!isAdmin && existingLead.createdBy && existingLead.createdBy !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this lead' });
        }

        // Clean up body to prevent updating immutable fields
        const updates = { ...req.body };
        delete updates._id;
        delete updates.id;
        delete updates.createdAt;
        delete updates.updatedAt;
        // delete updates.createdBy; // Optionally preserve owner, but generally shouldn't change here.

        // Prevent notes from being overwritten by updateLead - notes should be append-only via addNote
        delete updates.notes;

        const lead = await Lead.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });

        res.status(200).json(lead);
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Admin: Get lead creation stats per user
// @route   GET /api/admin/lead-stats
// @access  Private (Admin only)
exports.getAdminLeadStats = async (req, res) => {
    try {
        // Double check admin role
        const { userId } = req.auth;
        const isAdmin = await verifyAdmin(userId);

        if (!isAdmin) {
            return res.status(403).json({ message: 'Access denied: Admin only' });
        }

        // 1. Fetch all users from Clerk to ensure we show everyone
        const clerkUsers = await clerkClient.users.getUserList({ limit: 100 });
        const clerkUserMap = new Map(clerkUsers.map(u => [u.id, u]));

        // 2. Aggregate stats from DB
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const dbStats = await Lead.aggregate([
            {
                $match: {} // Include ALL leads
            },
            {
                $group: {
                    _id: "$createdBy",
                    dbEmail: { $first: "$creatorEmail" }, // Fallback email
                    totalLeads: { $sum: 1 },
                    leadsToday: {
                        $sum: {
                            $cond: [
                                { $gte: ["$createdAt", startOfDay] },
                                1,
                                0
                            ]
                        }
                    },
                    lastCreatedAt: { $max: "$createdAt" }
                }
            }
        ]);

        // 3. Merge Data
        // We want a row for every Clerk user, AND any DB stats that don't match a clerk user (orphaned/legacy)
        const dbStatsMap = new Map(dbStats.map(s => [s._id, s]));

        // Collect all unique User IDs (from Clerk + DB)
        // dbStats might have `null` _id for legacy leads without creator.
        const allUserIds = new Set([...clerkUserMap.keys(), ...dbStatsMap.keys()]);

        const finalStats = [];

        for (const uid of allUserIds) {
            const clerkUser = clerkUserMap.get(uid);
            const stats = dbStatsMap.get(uid);

            // Determine Email & Role
            let email = 'Unknown User';
            let role = 'user';

            if (clerkUser) {
                email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;
                role = clerkUser.publicMetadata?.role || 'user';
            } else if (stats && stats.dbEmail) {
                email = stats.dbEmail + ' (Deleted)';
                role = 'deleted';
            } else if (uid === null || uid === 'null') {
                email = 'Legacy / Unassigned';
                role = 'system';
            }

            // Only add if we have a valid user or valid stats
            // If it's a Clerk user, we ALWAYS add.
            // If it's a DB stat without Clerk user, we add.

            finalStats.push({
                userId: uid || 'legacy',
                email: email,
                role: role,
                totalLeads: stats ? stats.totalLeads : 0,
                leadsToday: stats ? stats.leadsToday : 0,
                lastCreatedAt: stats ? stats.lastCreatedAt : null
            });
        }

        // 4. Sort by Total Leads (Desc)
        finalStats.sort((a, b) => b.totalLeads - a.totalLeads);

        res.status(200).json(finalStats);
    } catch (error) {
        console.error('Error in getAdminLeadStats:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add note to lead
// @route   POST /api/leads/:id/notes
// @access  Private
exports.addNote = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        // Access Check
        const { userId, sessionClaims } = req.auth;
        const isAdmin = sessionClaims?.metadata?.role === 'admin';
        if (!isAdmin && lead.createdBy && lead.createdBy !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { content } = req.body;
        const note = {
            id: new Date().getTime().toString(), // Simple ID generation
            content,
            createdAt: new Date(),
        };

        lead.notes.push(note);
        await lead.save();

        res.status(201).json(note);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Archive (close/drop) lead - essentially same as update but semantic
// @route   PATCH /api/leads/:id/archive
// @access  Private
// Note: Frontend currently just updates status to Closed/Dropped via updateLead. 
// This endpoint is optional if we stick to updateLead, but requested in spec.
exports.archiveLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        const { userId, sessionClaims } = req.auth;
        const isAdmin = sessionClaims?.metadata?.role === 'admin';
        if (!isAdmin && lead.createdBy && lead.createdBy !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        lead.archived = true;
        await lead.save();

        res.status(200).json(lead);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
exports.deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        const { userId, sessionClaims } = req.auth;
        const isAdmin = sessionClaims?.metadata?.role === 'admin';
        if (!isAdmin && lead.createdBy && lead.createdBy !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Lead.deleteOne({ _id: req.params.id });

        res.status(200).json({ message: 'Lead deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
