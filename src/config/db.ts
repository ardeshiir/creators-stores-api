import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const DB_USER = process.env.DB_USER || 'admin';
        const DB_PASS = process.env.DB_PASS || 'secret';
        const DB_HOST = process.env.DB_HOST || 'localhost';
        const DB_PORT = process.env.DB_PORT || '27017';
        const DB_NAME = process.env.DB_NAME || 'myapp';

        const uri = process.env.DATABASE_URL || '';

        await mongoose.connect(uri);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1); // Exit if DB fails
    }
};

export default connectDB;
