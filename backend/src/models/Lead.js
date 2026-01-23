const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    source: {
        type: String,
        required: true,
        enum: ['LinkedIn', 'WhatsApp', 'Referral', 'Website', 'Other'],
    },
    primaryContact: {
        type: String,
        default: '',
    },
    linkedInUrl: {
        type: String,
        required: false,
    },
    linkedinPostUrl: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['New', 'Contacted', 'Interested', 'Follow-up', 'Closed', 'Dropped'],
    },
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium',
    },
    nextAction: {
        type: String,
        default: '',
    },
    nextActionDate: {
        type: String,
        default: '',
    },
    contextNote: {
        type: String,
        default: '',
    },
    tags: {
        type: [String],
        default: [],
    },
    valueEstimate: {
        type: String,
        default: '',
    },
    // Admin Review Fields
    adminReview: {
        type: String,
        enum: ['Sent Message', 'Sent Note', 'Hiring Post', 'Other'],
        default: null,
    },
    adminReviewNote: {
        type: String,
        default: null,
    },
    // New Fields
    relevantLinks: {
        type: [String],
        default: [],
    },
    documents: {
        type: [{
            filename: String,
            mimetype: String,
            size: Number,
            path: String, // Store local path for now
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],
        default: [],
    },
    followUps: {
        type: [{
            date: String, // Storing as YYYY-MM-DD string to match nextActionDate format or Date?
            note: String
        }],
        default: [],
    },
    meetingNotes: {
        type: [{
            title: String,
            note: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        default: [],
    },
    notes: {
        type: [noteSchema],
        default: [],
    },
    lastContactedAt: {
        type: String,
        default: () => new Date().toISOString(),
    },
    archived: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: String,
        required: false, // Optional for now to support legacy data
        index: true,
    },
    creatorEmail: {
        type: String,
        required: false,
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    },
    toObject: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

module.exports = mongoose.model('Lead', leadSchema);
