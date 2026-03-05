const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Schema matching the VM Onboarding Contact Form structure
const vmOnboardingSchema = new mongoose.Schema({
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
    services: String,
    budgetRange: String,
    status: {
        type: String,
        default: 'New'
    }
}, { strict: false }); // Allow other fields if schema varies

let VmOnboarding;

try {
    const conn = connectDB.getWebsiteConnection();
    if (conn) {
        // 'vm_onboarding' is the collection name in the Website DB (venturemond cluster)
        VmOnboarding = conn.model('VmOnboarding', vmOnboardingSchema, 'vm_onboarding');
    } else {
        console.warn('⚠️ Website DB connection not initialized. VmOnboarding model will be unavailable.');
    }
} catch (error) {
    console.error('Error initializing VmOnboarding model:', error);
}

module.exports = VmOnboarding;
