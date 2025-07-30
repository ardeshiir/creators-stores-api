import { Request, Response, NextFunction } from 'express';
import { Shop } from '../models/Shop';

// Create Shop
export const createShop = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const shop = await Shop.create(req.body);
        res.status(201).json(shop);
    } catch (error) {
        next(error);
    }
};

// Get all Shops
export const getShops = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const shops = await Shop.find();
        res.json(shops);
    } catch (error) {
        next(error);
    }
};

// Get single Shop by ID
export const getShopById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json(shop);
    } catch (error) {
        next(error);
    }
};

// Update Shop by ID
export const updateShop = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json(shop);
    } catch (error) {
        next(error);
    }
};

// Delete Shop
export const deleteShop = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const shop = await Shop.findByIdAndDelete(req.params.id);
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json({ message: 'Shop deleted successfully' });
    } catch (error) {
        next(error);
    }
};
