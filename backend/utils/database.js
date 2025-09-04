import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // Enhanced connection options for stability
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Connection pool settings
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            
            // Replica set settings
            heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds to keep connection alive
            
            // Retry settings
            retryWrites: true,
            retryReads: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Handle connection events
        mongoose.connection.on('connected', () => {
            console.log('✅ Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ Mongoose disconnected - attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 Mongoose reconnected to MongoDB');
        });

        mongoose.connection.on('close', () => {
            console.log('🔒 Mongoose connection closed');
        });

        // Handle process termination gracefully
        const gracefulShutdown = async (signal) => {
            console.log(`🛑 Received ${signal}. Closing MongoDB connection...`);
            try {
                await mongoose.connection.close();
                console.log('✅ MongoDB connection closed through app termination');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error during MongoDB shutdown:', error);
                process.exit(1);
            }
        };

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

        return conn;
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        
        // Retry connection after 5 seconds
        setTimeout(() => {
            console.log('🔄 Retrying MongoDB connection...');
            connectDB();
        }, 5000);
    }
};

export default connectDB;
