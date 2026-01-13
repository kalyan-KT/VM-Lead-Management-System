const Lead = require('../models/Lead');

// @desc    Get all leads
// @route   GET /api/leads
// @access  Public
exports.getLeads = async (req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 });
        res.status(200).json(leads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Public
exports.createLead = async (req, res) => {
    try {
        const lead = await Lead.create(req.body);
        res.status(201).json(lead);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Public
exports.getLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }
        res.status(200).json(lead);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Public
exports.updateLead = async (req, res) => {
    try {
        const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }
        res.status(200).json(lead);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Add note to lead
// @route   POST /api/leads/:id/notes
// @access  Public
exports.addNote = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
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
// @access  Public
// Note: Frontend currently just updates status to Closed/Dropped via updateLead. 
// This endpoint is optional if we stick to updateLead, but requested in spec.
exports.archiveLead = async (req, res) => {
    try {
        const lead = await Lead.findByIdAndUpdate(
            req.params.id,
            { archived: true },
            { new: true }
        );
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }
        res.status(200).json(lead);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
