import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
    createShop,
    getShops,
    getShopById,
    updateShop,
    deleteShop, getShopByShopId,
} from '../controllers/shopController';

const router = Router();

// Protected routes using authMiddleware
router.post('/', authMiddleware, createShop);
router.get('/', authMiddleware, getShops);
router.get('/:id', authMiddleware, getShopById);
router.get('/shopid/:shopId', authMiddleware, getShopByShopId);
router.put('/:id', authMiddleware, updateShop);
router.delete('/:id', authMiddleware, deleteShop);

export default router;
