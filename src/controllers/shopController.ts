import { Request, Response, NextFunction } from 'express';
import { Shop } from '../models/Shop';
import {User} from "../models/User";
import {createOtp, generateAndSendOtp} from "./authController";
import {Otp} from "../models/Otp";
import bcrypt from "bcrypt";
import {AuthRequest} from "../middlewares/authMiddleware";
import {State} from "../models/State";
import {getRoleBasedFilter} from "../middlewares/getRoleBasedFilter";

// Create Shop
export const createShop = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { specialistName, specialistPhoneNumber, ...shopData } = req.body;

        // 1. Ensure auth middleware added user
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // 2. Compare JWT claims with body specialist fields
        /*if (req.user.phone !== specialistPhoneNumber || req.user.name !== specialistName) {
            return res.status(403).json({
                error_key: "INVALID_SPECIALIST",
                message: "Specialist credentials do not match the authenticated user",
            });
        }*/

        // 3. Fetch the actual specialist from DB by userId in token
        const specialist = await User.findById(req.user.userId);
        if (!specialist) {
            return res.status(404).json({
                error_key: "USER_NOT_FOUND",
                message: "Specialist not found in database",
            });
        }

        // 4. Create shop with specialist reference
        const shop = await Shop.create({
            ...shopData,
            specialist: specialist._id,
            verified: false,
        });
        await syncStateCity(shopData.address.state,shopData.address.city)
        // 5. Generate OTP for this specialist’s phone and send it
        await generateAndSendOtp(specialist.phone);

        res.status(201).json({
            message: "Shop created in pending state. OTP sent to specialist.",
            shopId: shop._id,
        });
    } catch (error) {
        next(error);
    }
};

export const verifyShop = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { shopID, code } = req.body;

        const shop = await Shop.findById(shopID).populate("specialist");
        if (!shop) {
            return res.status(404).json({ error_key: "SHOP_NOT_FOUND", message: "Shop not found" });
        }

        const specialistPhone = (shop.specialist as any).phone;

        // Check OTP for specialist phone
        const record = await Otp.findOne({ phone: specialistPhone });
        if (!record) return res.status(400).json({ error_key: "INVALID_OTP", message: "Invalid OTP" });

        if (record.expiresAt < new Date()) {
            await Otp.deleteMany({ phone: specialistPhone });
            return res.status(400).json({ error_key: "EXPIRED_OTP", message: "OTP expired" });
        }

        const isMatch = await bcrypt.compare(code, record.code);
        if (!isMatch) {
            return res.status(400).json({ error_key: "INVALID_OTP", message: "Invalid OTP" });
        }

        // Mark shop as verified
        shop.verified = true;
        await shop.save();

        // Delete OTP after verification
        await Otp.deleteMany({ phone: specialistPhone });

        res.json({ message: "Shop verified successfully", shop });
    } catch (error) {
        next(error);
    }
};


export const resendShopOtp = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const shop = await Shop.findById(id).populate("specialist");
        if (!shop) {
            return res.status(404).json({ error_key: "SHOP_NOT_FOUND", message: "Shop not found" });
        }
        if (shop.verified) {
            return res.status(400).json({ error_key: "ALREADY_VERIFIED", message: "Shop already verified" });
        }

        const specialistPhone = (shop.specialist as any).phone;

        // Delete old OTPs
        await Otp.deleteMany({ phone: specialistPhone });

        // Generate new OTP
        await generateAndSendOtp(specialistPhone);

        res.json({ message: "OTP resent successfully" });
    } catch (error) {
        next(error);
    }
};

// Get all Shops
export const getShops = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const filter = await getRoleBasedFilter(req.user);
        const shops = await Shop.find(filter);
        res.json(shops);
    } catch (error) {
        next(error);
    }
};

export const getShopByShopId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { shopId } = req.params;

        // Ensure shopId is a number
        const numericShopId = parseInt(shopId, 10);
        if (isNaN(numericShopId)) {
            return res.status(400).json({ message: 'Invalid shopId. Must be a number.' });
        }

        const shop = await Shop.findOne({ shopId: numericShopId });

        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        return res.status(200).json(shop);
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

export const filterShops = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            state,
            city,
            purchaseMethod,
            hasSignBoard,
            hasDisplayStand,
            hasShowCase,
            sellerType,
            propertyStatus
        } = req.query;

        const filter: any = {};


        if (state) {
            const states = Array.isArray(state) ? state : String(state).split(",");
            filter["address.state"] = { $in: states };
        }

        if (city) {
            const cities = Array.isArray(city) ? city : String(city).split(",");
            filter["address.city"] = { $in: cities };
        }

        if (purchaseMethod) {
            filter.purchaseMethod = purchaseMethod;
        }

        if(propertyStatus){
            filter.propertyStatus = propertyStatus;
        }

        if (sellerType) {
            filter["storeDescription.sellerType"] = sellerType;
        }

        // signBoard exists?
        if (hasSignBoard === "true") {
            filter.signBoard = { $exists: true, $ne: [] };
        }
        if (hasSignBoard === "false") {
            filter.signBoard = { $in: [null, []] };
        }

        // displayStand exists?
        if (hasDisplayStand === "true") {
            filter.displayStand = { $exists: true };
        }
        if (hasDisplayStand === "false") {
            filter.displayStand = { $exists: false };
        }

        // showCase exists?
        if (hasShowCase === "true") {
            filter.showCase = { $exists: true, $ne: [] };
        }
        if (hasShowCase === "false") {
            filter.showCase = { $in: [null, []] };
        }

        const shops = await Shop.find(filter);
        return res.json(shops);
    } catch (error) {
        next(error);
    }
};


async function syncStateCity(stateName: string, cityName: string) {
    const stateDoc = await State.findOne({ name: stateName });
    if (!stateDoc) {
        await State.create({ name: stateName, cities: [cityName] });
    } else if (!stateDoc.cities.includes(cityName)) {
        stateDoc.cities.push(cityName);
        await stateDoc.save();
    }
}