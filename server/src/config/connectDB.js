const mongoose = require('mongoose');

require('dotenv').config({ override: true });

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is missing in environment');
        }

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 15000,
        });

        console.log('Connected to MongoDB');
        return mongoose.connection;
    } catch (error) {
        console.log('MongoDB connection failed:', error.message);
        throw error;
    }
};

module.exports = connectDB;
