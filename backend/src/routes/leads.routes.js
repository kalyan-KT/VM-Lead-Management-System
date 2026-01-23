const express = require('express');
const router = express.router ? express.Router() : express.Router; // Safe check, typically express.Router()
// Actually valid syntax is express.Router()

const {
    getLeads,
    createLead,
    getLead,
    updateLead,
    addNote,
    archiveLead,
    deleteLead,
    getAdminLeadStats,
    cloneLead,
} = require('../controllers/leads.controller');

const routes = express.Router();
const multer = require('multer');
const path = require('path');
const requireAuth = require('../middleware/auth.middleware');

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Apply Auth Middleware to all API routes
// We can apply globally or per route. Since we want all lead operations to be protected now:
routes.use(requireAuth);

// Check duplicate endpoint (Must be before /:id)
routes.get('/check-duplicate', require('../controllers/leads.controller').checkDuplicate);

// Admin Stats Route
routes.get('/admin/lead-stats', getAdminLeadStats);

// Upload Endpoint
routes.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    // Return metadata
    res.json({
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
    });
});

// Download Endpoint - Optional: Protect this too? 
// Current impl uses path param. Let's keep it protected via the global use(requireAuth) above.
routes.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads', filename);

    res.download(filePath, (err) => {
        if (err) {
            console.error('File download error:', err);
            if (!res.headersSent) {
                res.status(404).json({ message: 'File not found' });
            }
        }
    });
});

routes.route('/').get(getLeads).post(createLead);
routes.route('/:id').get(getLead).put(updateLead).delete(deleteLead);
routes.route('/:id/notes').post(addNote);
routes.route('/:id/archive').patch(archiveLead);
routes.route('/:id/clone').post(cloneLead);

module.exports = routes;
