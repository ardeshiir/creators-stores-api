import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import {authMiddleware, roleMiddleware} from "./middlewares/authMiddleware";
import shopRoutes from "./routes/shopRoutes";
import {createUser} from "./controllers/userController";
import stateRoutes from "./routes/stateRoutes";

const app = express();

const allowedOrigins = [
    'http://192.168.1.102:3000',
    'http://localhost:3000',
    'https://stores.creatorsclass.co'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Allow non-browser tools (like curl)
        const normalizedOrigin = origin.replace(/\/$/, ''); // Remove trailing slash if present

        if (allowedOrigins.includes(normalizedOrigin) ||  true) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/v1/user',authMiddleware,
    roleMiddleware(["global_manager"]), userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/state', authMiddleware, stateRoutes);
app.use('/api/v1/shop', authMiddleware, shopRoutes);
app.use('/api/v1/upload', authMiddleware, uploadRoutes);


// Global error handler (should be after routes)
app.use(errorHandler);

export default app;