import { Request, Response, NextFunction } from 'express';
import { Shop } from '../models/Shop';
import {IUser, User} from "../models/User";
import { generateAndSendOtp } from "./authController";
import { Otp } from "../models/Otp";
import bcrypt from "bcrypt";
import { AuthRequest } from "../middlewares/authMiddleware";
import ExcelJS from 'exceljs'
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

    // @ts-ignore
    const cityDoc = stateDoc.cities.find((c) => c.name === safeCityName);

    if (!cityDoc) {
        stateDoc.cities.push({
            name: safeCityName,
            districts: district ? [district] : [],
        });
    } else if (district && !cityDoc?.districts?.includes(district)) {
        cityDoc?.districts?.push(district);
    }

    await stateDoc.save();
}


// controllers/shopController.ts
export const searchShops = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ message: 'Search query (q) is required' });
        }

        // Search by store name, code, specialist name, or city/state, etc.
        const shops = await Shop.find({
            $or: [
                { storeName: { $regex: q, $options: 'i' } },
                { storeCode: { $regex: q, $options: 'i' } },
                { 'specialistName': { $regex: q, $options: 'i' } },
                { 'address.city': { $regex: q, $options: 'i' } },
                { 'address.state': { $regex: q, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });

        res.json(shops);
    } catch (error) {
        next(error);
    }
};


export const exportShops = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const {
            state,
            city,
            sellerType,
            purchaseMethod,
            hasSignBoard,
            hasDisplayStand,
            hasShowCase,
        } = req.query;

        const filter: any = {};

        if (state) filter["address.state"] = { $in: Array.isArray(state) ? state : [state] };
        if (city) filter["address.city"] = { $in: Array.isArray(city) ? city : [city] };
        if (sellerType) filter["storeDescription.sellerType"] = sellerType;
        if (purchaseMethod) filter["purchaseMethod"] = purchaseMethod;
        if (hasSignBoard !== undefined) filter["signBoard.0"] = hasSignBoard === "true" ? { $exists: true } : { $exists: false };
        if (hasDisplayStand !== undefined) filter["displayStand"] = hasDisplayStand === "true" ? { $exists: true } : { $exists: false };
        if (hasShowCase !== undefined) filter["showCase.0"] = hasShowCase === "true" ? { $exists: true } : { $exists: false };

        const shops = await Shop.find(filter)
            .sort({ createdAt: -1 })
            .populate("specialist", "name lastName phone identifierCode role");

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Shops");

        sheet.columns = [
            { header: "ID", key: "_id", width: 24 },
            { header: "کد فروشگاه", key: "storeCode", width: 15 },
            { header: "نام فروشگاه", key: "storeName", width: 25 },

            // Specialist info
            { header: "نام کارشناس", key: "specialistName", width: 20 },
            { header: "نام خانوادگی کارشناس", key: "specialistLastName", width: 20 },
            { header: "شماره تماس کارشناس", key: "specialistPhone", width: 20 },
            { header: "کد شناسایی کارشناس", key: "specialistIdentifier", width: 20 },
            { header: "نقش کارشناس", key: "specialistRole", width: 15 },

            // Shop personal
            { header: "نام صاحب فروشگاه", key: "ownerName", width: 20 },
            { header: "نام‌خانوادگی صاحب فروشگاه", key: "ownerLastName", width: 20 },
            { header: "موبایل‌ها", key: "mobile", width: 20 },

            // Properties
            { header: "نوع مالکیت", key: "propertyStatus", width: 15 },
            { header: "روش خرید", key: "purchaseMethod", width: 15 },

            // Store description
            { header: "متراژ", key: "area", width: 10 },
            { header: "سابقه فعالیت", key: "activityHistory", width: 15 },
            { header: "سابقه همکاری", key: "cooperationHistory", width: 15 },
            { header: "نوع فروشنده", key: "sellerType", width: 15 },

            // Address
            { header: "استان", key: "state", width: 15 },
            { header: "شهر", key: "city", width: 15 },
            { header: "منطقه", key: "district", width: 10 },
            { header: "آدرس", key: "addressDesc", width: 40 },
            { header: "کد پستی", key: "postalcode", width: 15 },
            { header: "شماره تلفن ثابت", key: "landLine", width: 15 },
            { header: "شماره تماس ثابت", key: "phoneNumber", width: 25 },
            { header: "لوکیشن LAT", key: "lat", width: 15 },
            { header: "لوکیشن LON", key: "lon", width: 15 },

            // SignBoard
            { header: "تابلو – عرض", key: "signWidth", width: 12 },
            { header: "تابلو – ارتفاع", key: "signHeight", width: 12 },
            { header: "نوع تابلو", key: "signType", width: 20 },

            // Display Stand
            { header: "استند – نوع", key: "displayType", width: 15 },
            { header: "استند – برند", key: "displayBrand", width: 15 },

            // ShowCase
            { header: "ویترین – عرض", key: "showWidth", width: 12 },
            { header: "ویترین – ارتفاع", key: "showHeight", width: 12 },
            { header: "ویترین – استیکر", key: "showSticker", width: 10 },

            // Other
            { header: "برندهای دیگر", key: "otherBrands", width: 25 },
            { header: "توضیحات", key: "description", width: 40 },
            { header: "وضعیت تایید", key: "verified", width: 12 },
            { header: "تاریخ ثبت", key: "createdAt", width: 25 },
        ];

        shops.forEach((shop) => {
            const sign = shop.signBoard?.[0];
            const show = shop.showCase?.[0];
            const ds = shop.displayStand;

            sheet.addRow({
                _id: (shop._id as any).toString(),
                storeCode: shop.storeCode,
                storeName: shop.storeName,

                specialistName: (shop.specialist as IUser)?.name,
                specialistLastName: (shop.specialist as IUser)?.lastName,
                specialistPhone: (shop.specialist as IUser)?.phone,
                specialistIdentifier: (shop.specialist as IUser)?.identifierCode,
                specialistRole: (shop.specialist as IUser)?.role,

                ownerName: shop.name,
                ownerLastName: shop.lastName,
                mobile: shop.mobile?.join(", "),

                propertyStatus: shop.propertyStatus,
                purchaseMethod: shop.purchaseMethod,

                area: shop.storeDescription?.area,
                activityHistory: shop.storeDescription?.activityHistory,
                cooperationHistory: shop.storeDescription?.cooperationHistory,
                sellerType: shop.storeDescription?.sellerType,

                state: shop.address?.state,
                city: shop.address?.city,
                district: shop.address?.district,
                addressDesc: shop.address?.description,
                postalcode: shop.address?.postalcode,
                phoneNumber: shop.address?.phoneNumber?.join(", "),
                landLine: shop.address?.landLine,
                lat: shop.address?.location?.lat,
                lon: shop.address?.location?.lon,

                signWidth: sign?.dimensions?.width,
                signHeight: sign?.dimensions?.height,
                signType: sign?.type,

                displayType: ds?.type,
                displayBrand: ds?.brand,

                showWidth: show?.dimensions?.width,
                showHeight: show?.dimensions?.height,
                showSticker: show?.sticker ? "بله" : "خیر",

                otherBrands: shop.otherBrands?.join(", "),
                description: shop.description || "-",
                verified: shop.verified ? "تایید شده" : "در انتظار",
                createdAt: shop.createdAt?.toLocaleString("fa-IR"),
            });
        });

        res.setHeader("Content-Disposition", 'attachment; filename="shops-export.xlsx"');
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
};
