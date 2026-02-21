const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Schema matching the Stacli Website Contact Form structure
const stacliLeadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // Optional fields present in stacli form
    company: String,
    interest: String,
    service: String,
    projectBrief: String,
    budget: String,
    timeframe: String,
    status: {
        type: String,
        default: 'New'
    }
}, { strict: false }); // Allow other fields if schema varies

let StacliLead;

try {
    const conn = connectDB.getWebsiteConnection();
    if (conn) {
        // 'stacli_contacts' is the collection name in the Website DB (venturemond cluster)
        StacliLead = conn.model('StacliLead', stacliLeadSchema, 'stacli_contacts');
    } else {
        console.warn('⚠️ Website DB connection not initialized. StacliLead model will be unavailable.');
    }
} catch (error) {
    console.error('Error initializing StacliLead model:', error);
}

module.exports = StacliLead;
