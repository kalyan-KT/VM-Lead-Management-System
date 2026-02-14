const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Schema matching the Website Contact Form structure
const websiteLeadSchema = new mongoose.Schema({
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
    // Optional fields present in website form
    phone: String,
    company: String,
    service: String,
    status: {
        type: String,
        default: 'New'
    }
}, { strict: false }); // Allow other fields if schema varies

let WebsiteLead;

try {
    const conn = connectDB.getWebsiteConnection();
    if (conn) {
        // 'contacts' is the collection name in the Website DB
        WebsiteLead = conn.model('WebsiteLead', websiteLeadSchema, 'contacts');
    } else {
        console.warn('⚠️ Website DB connection not initialized. WebsiteLead model will be unavailable.');
    }
} catch (error) {
    console.error('Error initializing WebsiteLead model:', error);
}

module.exports = WebsiteLead;
