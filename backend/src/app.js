const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('Lead Management API is running...');
});

// Import Routes
const leadRoutes = require('./routes/leads.routes');
const adminRoutes = require('./routes/admin.routes');
const folderRoutes = require('./routes/folders.routes');

app.use('/api/leads', leadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/folders', folderRoutes);

module.exports = app;
