import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
    createShop,
    getShops,
    getShopById,
    updateShop,
    deleteShop,
} from '../controllers/shopController';

const router = Router();

// Protected routes using authMiddleware
router.post('/', authMiddleware, createShop);
router.get('/', authMiddleware, getShops);
router.get('/:id', authMiddleware, getShopById);
router.put('/:id', authMiddleware, updateShop);
router.delete('/:id', authMiddleware, deleteShop);

export default router;
