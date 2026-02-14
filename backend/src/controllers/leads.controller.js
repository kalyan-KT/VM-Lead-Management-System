const Lead = require('../models/Lead');
const WebsiteLead = require('../models/WebsiteLead'); // Import new model
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

        // Actually, if sessionClaims is OLD, it won't have the role.
        if (!isAdmin) {
            isAdmin = await verifyAdmin(userId);
        }

        let query = {};
        if (!isAdmin) {
            query.createdBy = userId;
        }

        let leads = await Lead.find(query).sort({ createdAt: -1 });

        // If Admin, leads variable already contains LMS leads from Lead.find()
        // We do NOT merge Website leads anymore. Separate endpoint exists.

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
        const { userId, sessionClaims } = req.auth;
        let isAdmin = sessionClaims?.metadata?.role === 'admin';
        if (!isAdmin) {
            isAdmin = await verifyAdmin(userId);
        }

        let lead = await Lead.findById(req.params.id);
        let isWebsite = false;

        // Failover to Website Leads for Admins
        if (!lead && isAdmin && WebsiteLead) {
            const webLead = await WebsiteLead.findById(req.params.id);
            if (webLead) {
                isWebsite = true;
                const wl = webLead.toObject();
                // Map to Lead structure
                lead = {
                    ...wl,
                    id: wl._id.toString(),
                    source: 'Website',
                    status: wl.status || 'New',
                    primaryContact: wl.email,
                    contextNote: `Message: ${wl.message || ''}\nPhone: ${wl.phone || ''}`,
                    company: wl.company || '',
                    service: wl.service || '',
                    budget: wl.budget || '',
                    division: (wl.division && wl.division.includes('Studio')) ? 'Studio' : 'Services',
                    phone: wl.phone || '',
                    isWebsiteLead: true,
                    tags: [],
                    notes: [],
                    relevantLinks: [],
                    documents: [],
                    followUps: [],
                    meetingNotes: [],
                    createdBy: 'system'
                };
            }
        }

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        // Access control (already handled failover for admin)
        if (!isAdmin && !isWebsite && lead.createdBy && lead.createdBy !== userId) {
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
        const { userId, sessionClaims } = req.auth;
        let isAdmin = sessionClaims?.metadata?.role === 'admin';
        // Check fresh verification if token says not admin
        if (!isAdmin) {
            isAdmin = await verifyAdmin(userId);
        }

        let existingLead = await Lead.findById(req.params.id);
        let isWebsite = false;

        // Failover check for Website Leads (Admin only)
        if (!existingLead && isAdmin && WebsiteLead) {
            const webInfo = await WebsiteLead.findById(req.params.id);
            if (webInfo) {
                existingLead = webInfo;
                isWebsite = true;
            }
        }

        if (!existingLead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        if (!isAdmin && !isWebsite && existingLead.createdBy && existingLead.createdBy !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this lead' });
        }

        // Admin Review Protection
        if (!isAdmin && (req.body.adminReview !== undefined || req.body.adminReviewNote !== undefined)) {
            return res.status(403).json({ message: 'Access denied: Only admins can update Admin Review fields' });
        }

        const updates = { ...req.body };
        delete updates._id;
        delete updates.id;
        delete updates.createdAt;
        delete updates.updatedAt;
        delete updates.notes;

        let updatedLead;
        if (isWebsite) {
            // Handle Website Lead Update (Mapping back fields if needed)
            // Primarily we update status and maybe notes if mapped back?
            // WebsiteLead schema is loose/strict: false.
            updatedLead = await WebsiteLead.findByIdAndUpdate(req.params.id, updates, {
                new: true,
                runValidators: false,
            });
            // Return mapped format
            const ul = updatedLead.toObject();
            updatedLead = {
                ...ul,
                id: ul._id.toString(),
                source: 'Website', // Keep source fixed
                status: ul.status || 'New',
                primaryContact: ul.email,
                contextNote: `Message: ${ul.message || ''}\nPhone: ${ul.phone || ''}`,
                company: ul.company || '',
                service: ul.service || '',
                budget: ul.budget || '',
                division: (ul.division && ul.division.includes('Studio')) ? 'Studio' : 'Services',
                phone: ul.phone || '',
                isWebsiteLead: true,
                tags: [],
                notes: [],
                relevantLinks: [],
                documents: [],
                followUps: [],
                meetingNotes: [],
                createdBy: 'system'
            };
        } else {
            updatedLead = await Lead.findByIdAndUpdate(req.params.id, updates, {
                new: true,
                runValidators: true,
            });
        }

        res.status(200).json(updatedLead);
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
        const { userId, sessionClaims } = req.auth;
        let isAdmin = sessionClaims?.metadata?.role === 'admin';
        if (!isAdmin) isAdmin = await verifyAdmin(userId);

        let lead = await Lead.findById(req.params.id);
        let isWebsite = false;

        if (!lead && isAdmin && WebsiteLead) {
            lead = await WebsiteLead.findById(req.params.id);
            if (lead) isWebsite = true;
        }

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        if (!isAdmin && !isWebsite && lead.createdBy && lead.createdBy !== userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (isWebsite) {
            await WebsiteLead.deleteOne({ _id: req.params.id });
        } else {
            await Lead.deleteOne({ _id: req.params.id });
        }

        res.status(200).json({ message: 'Lead deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Clone lead to admin (Admin Only)
// @route   POST /api/leads/:id/clone
// @access  Private (Admin only)
exports.cloneLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, sessionClaims } = req.auth;

        // 1. Verify Admin
        let isAdmin = sessionClaims?.metadata?.role === 'admin';
        if (!isAdmin) {
            isAdmin = await verifyAdmin(userId);
        }
        if (!isAdmin) {
            return res.status(403).json({ message: 'Access denied: Admin only' });
        }

        // 2. Find Original Lead
        const originalLead = await Lead.findById(id);
        if (!originalLead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        // 3. Fetch Admin Email (for creatorEmail)
        const adminUser = await clerkClient.users.getUser(userId);
        const adminEmail = adminUser.emailAddresses.find(e => e.id === adminUser.primaryEmailAddressId)?.emailAddress || adminUser.emailAddresses[0]?.emailAddress;

        // 4. Create New Lead Object
        const newLeadData = originalLead.toObject();

        // Remove DB specific fields
        delete newLeadData._id;
        delete newLeadData.__v;
        delete newLeadData.createdAt;
        delete newLeadData.updatedAt;

        // Override fields
        newLeadData.createdBy = userId;
        newLeadData.creatorEmail = adminEmail;
        newLeadData.createdAt = new Date();
        // Keep original notes, etc.

        // 5. Save
        const newLead = await Lead.create(newLeadData);

        res.status(201).json(newLead);
    } catch (error) {
        console.error('Error cloning lead:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check if a LinkedIn Post Link already exists
// @route   POST /api/leads/check-duplicate
// @access  Private
exports.checkDuplicate = async (req, res) => {
    try {
        const { url, excludeId } = req.body;
        if (!url) {
            return res.status(400).json({ message: 'URL is required' });
        }

        // Check duplicate with excludeId
        const query = { relevantLinks: { $in: [url] } };
        if (excludeId) query._id = { $ne: excludeId };
        const existingLead = await Lead.findOne(query);

        if (existingLead) {
            // Return creator email
            return res.status(200).json({
                exists: true,
                createdBy: existingLead.creatorEmail || 'Unknown User'
            });
        }

        return res.status(200).json({ exists: false });
    } catch (error) {
        console.error('Error checking duplicate:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get website leads (Admin only)
// @route   GET /api/leads/website
// @access  Private (Admin only)
exports.getWebsiteLeads = async (req, res) => {
    try {
        const { userId, sessionClaims } = req.auth;
        let isAdmin = sessionClaims?.metadata?.role === 'admin';

        // Helper to verify Admin role securely
        if (!isAdmin) {
            isAdmin = await verifyAdmin(userId);
        }

        if (!isAdmin) {
            return res.status(403).json({ message: 'Access denied: Admin only' });
        }

        if (!WebsiteLead) {
            return res.status(503).json({ message: 'Website Database not connected' });
        }

        const webLeads = await WebsiteLead.find({}).sort({ createdAt: -1 });

        // Map Website Leads to match the LMS Lead structure
        const formattedWebLeads = webLeads.map(lead => {
            const webLead = lead.toObject();
            return {
                ...webLead,
                id: webLead._id.toString(),
                source: 'Website',
                status: webLead.status || 'New',
                primaryContact: webLead.email, // Use email as primary contact
                contextNote: `Message: ${webLead.message || ''}\nPhone: ${webLead.phone || ''}`, // Reduced contextNote as fields are now explicit
                // Explicit fields for UI
                company: webLead.company || '',
                service: webLead.service || '',
                budget: webLead.budget || '',
                // Simplify division: "Venturemond Services..." -> "Services", "Venturemond Studio..." -> "Studio"
                division: (webLead.division && webLead.division.includes('Studio')) ? 'Studio' : 'Services',
                phone: webLead.phone || '', // Keep phone accessible

                isWebsiteLead: true,
                tags: [],
                notes: [],
                relevantLinks: [],
                documents: [],
                followUps: [],
                meetingNotes: [],
                createdBy: 'system'
            };
        });

        res.status(200).json(formattedWebLeads);
    } catch (error) {
        console.error('Error fetching website leads:', error);
        res.status(500).json({ message: error.message });
    }
};
