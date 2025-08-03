import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import {authMiddleware} from "./middlewares/authMiddleware";
import shopRoutes from "./routes/shopRoutes";

const app = express();

app.use(cors({
    origin: 'https://stores.creatorsclass.co/',
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