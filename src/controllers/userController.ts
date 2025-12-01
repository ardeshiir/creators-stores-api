import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import {State} from "../models/State";
import ExcelJS from "exceljs";
import {AuthRequest} from "../middlewares/authMiddleware";

// Create a user
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { city, district, identifierCode, lastName, name, phone, role, state }  = req.body
        const newUser = await User.create({
            name,
            lastName,
            phone,
            role,
            state,
            city,
            district,
            identifierCode,
        });

        // Sync to State collection
        await syncUserLocation(state, city, district);
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
};

// Get all users
export const getUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await User.find({ isActive: true })
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        next(error);
    }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        next(error);
    }
};

// Update user
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

// Delete user
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });
        res.json(deletedUser);
    } catch (error) {
        next(error);
    }
};

// Search users by name or lastName
export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q } = req.query;

        if (!q || typeof q !== "string") {
            return res.status(400).json({ message: "Search query (q) is required" });
        }

        // Case-insensitive search across both name and lastName
        const users = await User.find({isActive: true,
            $or: [
                { name: { $regex: q, $options: "i" } },
                { lastName: { $regex: q, $options: "i" } }
            ]
        });

        res.json(users);
    } catch (error) {
        next(error);
    }
};

export const filterUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { state, city, district, role } = req.query;

        const filter: any = {isActive: true};

        if (state) {
            const states = Array.isArray(state) ? state : String(state).split(',');
            filter.state = { $in: states };
        }

        if (city) {
            const cities = Array.isArray(city) ? city : String(city).split(',');
            filter.city = { $in: cities };
        }

        if (district) {
            const districts = Array.isArray(district) ? district : String(district).split(',');
            filter.district = { $in: districts.map((d) => Number(d)) };
        }

        if (role) {
            filter.role = role;
        }

        const users = await User.find(filter);
        return res.json(users);
    } catch (error) {
        next(error);
    }
};


export async function syncUserLocation(
    stateName?: string,
    cityName?: string,
    district?: number
) {
    // ✅ Ensure safe string values
    const safeStateName = typeof stateName === 'string' && stateName.trim() ? stateName.trim() : 'نامشخص';
    const safeCityName = typeof cityName === 'string' && cityName.trim() ? cityName.trim() : 'نا مشخص';

    console.log('[syncUserLocation]', { stateName, cityName, district, safeStateName, safeCityName });

    let stateDoc = await State.findOne({ name: safeStateName });

    if (!stateDoc) {
        // ✅ Create with validated fallback values
        stateDoc = await State.create({
            name: safeStateName,
            cities: [{ name: safeCityName, districts: district ? [district] : [] }],
        });
        return stateDoc;
    }

    // ✅ Find or create city safely
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
    return stateDoc;
}

export const exportUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { state, city, role, isActive } = req.query

        const filter: any = {}
        if (state) filter.state = { $in: Array.isArray(state) ? state : [state] }
        if (city) filter.city = { $in: Array.isArray(city) ? city : [city] }
        if (role) filter.role = role
        if (isActive !== undefined) filter.isActive = isActive === 'true'

        const users = await User.find(filter).sort({ createdAt: -1 })

        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet('Users')

        sheet.columns = [
            { header: 'ID', key: '_id', width: 25 },
            { header: 'نام', key: 'name', width: 20 },
            { header: 'نام خانوادگی', key: 'lastName', width: 20 },
            { header: 'کد شناسایی', key: 'identifierCode', width: 15 },
            { header: 'شماره تماس', key: 'phone', width: 20 },
            { header: 'نقش', key: 'role', width: 20 },
            { header: 'استان', key: 'state', width: 20 },
            { header: 'شهر', key: 'city', width: 20 },
            { header: 'منطقه', key: 'district', width: 10 },
            { header: 'وضعیت فعالیت', key: 'isActive', width: 15 },
            { header: 'تاریخ ایجاد', key: 'createdAt', width: 25 },
        ]

        users.forEach((u) => {
            sheet.addRow({
                _id: (u._id as any).toString(),
                name: u.name || '-',
                lastName: u.lastName || '-',
                identifierCode: u.identifierCode || '-',
                phone: u.phone,
                role:
                    u.role === 'field_agent'
                        ? 'کارشناس فروش'
                        : u.role === 'regional_manager'
                            ? 'مدیر منطقه'
                            : 'مدیر کل',
                state: u.state || '-',
                city: u.city || '-',
                district: u.district || '-',
                isActive: u.isActive ? 'فعال' : 'غیرفعال',
                createdAt: u.createdAt?.toLocaleString('fa-IR'),
            })
        })

        res.setHeader(
            'Content-Disposition',
            'attachment; filename="users-export.xlsx"'
        )
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

        await workbook.xlsx.write(res)
        res.end()
    } catch (err) {
        next(err)
    }
}