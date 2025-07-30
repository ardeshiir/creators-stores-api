import express from 'express';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import {authMiddleware} from "./middlewares/authMiddleware";
import shopRoutes from "./routes/shopRoutes";

const app = express();

app.use(express.json());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/shop', authMiddleware, shopRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);


// Global error handler (should be after routes)
app.use(errorHandler);

export default app;