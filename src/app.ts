import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import {authMiddleware} from "./middlewares/authMiddleware";
import shopRoutes from "./routes/shopRoutes";

const app = express();

const allowedOrigins = [
    'http://localhost:3000',
    'https://stores.creatorsclass.co'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Allow non-browser tools (like curl)
        const normalizedOrigin = origin.replace(/\/$/, ''); // Remove trailing slash if present

        if (allowedOrigins.includes(normalizedOrigin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/shop', authMiddleware, shopRoutes);
app.use('/api/v1/upload', authMiddleware, uploadRoutes);


// Global error handler (should be after routes)
app.use(errorHandler);

export default app;