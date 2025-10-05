import { Request, Response, NextFunction } from 'express';
import { Shop } from '../models/Shop';
import { User } from "../models/User";
import { generateAndSendOtp } from "./authController";
import { Otp } from "../models/Otp";
import bcrypt from "bcrypt";
import { AuthRequest } from "../middlewares/authMiddleware";
import { State } from "../models/State";
import { getRoleBasedFilter } from "../middlewares/getRoleBasedFilter";

// -------------------- CREATE --------------------
export const createShop = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { specialistName, specialistPhoneNumber, ...shopData } = req.body;
        console.log(JSON.stringify({userAttempting:req.user.userId, phone:specialistPhoneNumber, userAttemptinguser:req.user }))
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const specialist = await User.findById(req.user.userId);
        if (!specialist) {
            return res.status(404).json({
                error_key: "USER_NOT_FOUND",
                message: "Specialist not found in database",
            });
        }

        const shop = await Shop.create({
            ...shopData,
            specialist: specialist._id,
            verified: false,
        });

        await syncStateCity(shopData.address.state, shopData.address.city);

        await generateAndSendOtp(specialist.phone);

        res.status(201).json({
            message: "Shop created in pending state. OTP sent to specialist.",
            shopId: shop._id,
        });
    } catch (error) {
        next(error);
    }
};

// -------------------- VERIFY --------------------
export const verifyShop = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { shopID, code } = req.body;

        const shop = await Shop.findById(shopID).populate("specialist");
        if (!shop) {
            return res.status(404).json({ error_key: "SHOP_NOT_FOUND", message: "Shop not found" });
        }

        const specialistPhone = (shop.specialist as any).phone;

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

        shop.verified = true;
        await shop.save();

        await Otp.deleteMany({ phone: specialistPhone });

        res.json({ message: "Shop verified successfully", shop });
    } catch (error) {
        next(error);
    }
};

// -------------------- RESEND OTP --------------------
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

        await Otp.deleteMany({ phone: specialistPhone });
        await generateAndSendOtp(specialistPhone);

        res.json({ message: "OTP resent successfully" });
    } catch (error) {
        next(error);
    }
};

// -------------------- GET ALL --------------------
export const getShops = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const roleFilter = await getRoleBasedFilter(req.user);
        const shops = await Shop.find(roleFilter).sort({ createdAt: -1 });
        res.json(shops);
    } catch (error) {
        next(error);
    }
};

// -------------------- GET BY SHOPID --------------------
export const getShopByShopId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const numericShopId = parseInt(req.params.shopId, 10);
        if (isNaN(numericShopId)) {
            return res.status(400).json({ message: 'Invalid shopId. Must be a number.' });
        }

        const roleFilter = await getRoleBasedFilter(req.user);
        const shop = await Shop.findOne({ shopId: numericShopId, ...roleFilter });

        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json(shop);
    } catch (error) {
        next(error);
    }
};

// -------------------- GET BY ID --------------------
export const getShopById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const roleFilter = await getRoleBasedFilter(req.user);
        const shop = await Shop.findOne({ _id: req.params.id, ...roleFilter });

        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json(shop);
    } catch (error) {
        next(error);
    }
};

// -------------------- UPDATE --------------------
export const updateShop = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const roleFilter = await getRoleBasedFilter(req.user);
        const shop = await Shop.findOneAndUpdate({ _id: req.params.id, ...roleFilter }, req.body, { new: true });

        if (!shop) return res.status(404).json({ message: 'Shop not found or not authorized' });
        res.json(shop);
    } catch (error) {
        next(error);
    }
};

// -------------------- DELETE --------------------
export const deleteShop = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const roleFilter = await getRoleBasedFilter(req.user);
        const shop = await Shop.findOneAndDelete({ _id: req.params.id, ...roleFilter });

        if (!shop) return res.status(404).json({ message: 'Shop not found or not authorized' });
        res.json({ message: 'Shop deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// -------------------- FILTER --------------------
export const filterShops = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

        if (purchaseMethod) filter.purchaseMethod = purchaseMethod;
        if (propertyStatus) filter.propertyStatus = propertyStatus;
        if (sellerType) filter["storeDescription.sellerType"] = sellerType;

        if (hasSignBoard === "true") filter.signBoard = { $exists: true, $ne: [] };
        if (hasSignBoard === "false") filter.signBoard = { $in: [null, []] };

        if (hasDisplayStand === "true") filter.displayStand = { $exists: true };
        if (hasDisplayStand === "false") filter.displayStand = { $exists: false };

        if (hasShowCase === "true") filter.showCase = { $exists: true, $ne: [] };
        if (hasShowCase === "false") filter.showCase = { $in: [null, []] };

        const roleFilter = await getRoleBasedFilter(req.user);
        const shops = await Shop.find({ ...filter, ...roleFilter });

        res.json(shops);
    } catch (error) {
        next(error);
    }
};

// -------------------- SYNC STATE/CITY --------------------
export async function syncStateCity(
    stateName: string,
    cityName?: string,
    district?: number
) {
    const safeStateName = stateName?.trim() || 'نامشخص';
    const safeCityName = cityName?.trim() || 'نا مشخص';

    let stateDoc = await State.findOne({ name: safeStateName });

    if (!stateDoc) {
        stateDoc = await State.create({
            name: safeStateName,
            cities: [{ name: safeCityName, districts: district ? [district] : [] }],
        });
        return;
    }

    const cityDoc = stateDoc.cities.find((c) => c.name === safeCityName);

    if (!cityDoc) {
        stateDoc.cities.push({
            name: safeCityName,
            districts: district ? [district] : [],
        });
    } else if (district && !cityDoc.districts.includes(district)) {
        cityDoc.districts.push(district);
    }

    await stateDoc.save();
}
