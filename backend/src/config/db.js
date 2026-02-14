const mongoose = require('mongoose');

let websiteConnection = null;

const connectDB = async () => {
    try {
        // Setup Secondary (Sync start for early availability)
        // We initialize the connection object immediately if Env is available.
        if (process.env.WEBSITE_DB_URI) {
            console.log('Initializing Website DB connection...');
            websiteConnection = mongoose.createConnection(process.env.WEBSITE_DB_URI);

            websiteConnection.on('connected', () => {
                console.log('✅ Website Leads Database Connected');
            });

            websiteConnection.on('error', (err) => {
                console.error('❌ Website DB Error:', err);
            });
        }

        const uri = process.env.MONGODB_URI || '';
        // console.log('Connecting to MongoDB URI:', uri.replace(/:([^:@]+)@/, ':****@'));
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Export method to access the secondary connection
connectDB.getWebsiteConnection = () => websiteConnection;

module.exports = connectDB;
