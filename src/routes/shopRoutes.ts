import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
    createShop,
    getShops,
    getShopById,
    updateShop,
    deleteShop, getShopByShopId,
    verifyShop, resendShopOtp, filterShops, searchShops, exportShops,
} from '../controllers/shopController';

const router = Router();

// Protected routes using authMiddleware
router.post('/', authMiddleware, createShop);
router.post("/:id/resend-otp", authMiddleware, resendShopOtp);
router.get('/export', authMiddleware, exportShops)
router.get('/search', authMiddleware, searchShops);
router.post("/verify", authMiddleware, verifyShop);
router.get('/', authMiddleware, getShops);
router.get('/filter', authMiddleware, filterShops);
router.get('/:id', authMiddleware, getShopById);
router.get('/shopid/:shopId', authMiddleware, getShopByShopId);
router.put('/:id', authMiddleware, updateShop);
router.delete('/:id', authMiddleware, deleteShop);

export default router;
