const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Schema matching the Stacli Onboarding Contact Form structure
const stacliOnboardingSchema = new mongoose.Schema({
    fullName: {
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
    // Optional fields present in onboarding form
    companyName: String,
    services: [String],
    budgetRange: String,
    status: {
        type: String,
        default: 'New'
    }
}, { strict: false }); // Allow other fields if schema varies

let StacliOnboarding;

try {
    const conn = connectDB.getWebsiteConnection();
    if (conn) {
        // 'stacli_onboarding' is the collection name in the Website DB (venturemond cluster)
        StacliOnboarding = conn.model('StacliOnboarding', stacliOnboardingSchema, 'stacli_onboarding');
    } else {
        console.warn('⚠️ Website DB connection not initialized. StacliOnboarding model will be unavailable.');
    }
} catch (error) {
    console.error('Error initializing StacliOnboarding model:', error);
}

module.exports = StacliOnboarding;
