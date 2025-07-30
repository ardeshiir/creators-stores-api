// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { Otp } from '../models/Otp';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import Kavenegar from'kavenegar';
import crypto from "crypto";

import bcrypt from 'bcrypt';

const OTP_EXPIRATION_MINUTES = 5;

export async function createOtp(phone: string) {
    const code = generateOtp();
    const hashedCode = await bcrypt.hash(code, 10);

    await Otp.create({
        phone,
        code: hashedCode,
        expiresAt: new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000),
    });

    return code; // Return plain OTP to send via SMS
}


function generateOtp(): string {
    const otp = crypto.randomInt(100000, 999999); // cryptographically secure random
    return otp.toString();
}

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ message: 'Phone is required' });

        // ✅ Check if user is registered
        const existingUser = await User.findOne({ phone });
        if (!existingUser) {
            return res.status(404).json({ message: 'User not registered. Please sign up first.' });
        }

        // ✅ Generate OTP
        const code = await createOtp(phone);


        // ✅ Send SMS via Kavenegar
        console.log(`Sending OTP ${code} to ${phone}`);
        const api = Kavenegar.KavenegarApi({ apikey: config.kavenegarApiKey });
        api.Send(
            {
                message: `کد ورود شما: 
                Code:${code}`,
                sender: "2000660110",
                receptor: phone,
            },
            () => {
                console.log(`OTP Sent ${code} to ${phone}`);
            }
        );

        return res.status(200).json({ message: 'OTP sent' });
    } catch (error) {
        next(error);
    }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { phone, code } = req.body;
        if (!phone || !code) return res.status(400).json({ message: 'Phone and OTP are required' });

        const record = await Otp.findOne({ phone });
        if (!record) return res.status(400).json({ message: 'Invalid or expired OTP' });

        if (record.expiresAt < new Date()) {
            await Otp.deleteMany({ phone });
            return res.status(400).json({ message: 'OTP expired' });
        }

        const isMatch = await bcrypt.compare(code, record.code);
        if (!isMatch) throw new Error('Invalid OTP');

        // Upsert user
        let user = await User.findOne({ phone });
        if (!user) {
            user = await User.create({ phone });
        }

        // Delete OTP after use
        await Otp.deleteMany({ phone });

        // Sign JWT
        const token = jwt.sign({ userId: user._id, phone: user.phone }, config.jwtSecret, {
            expiresIn: '7d',
        });

        res.json({ token });
    } catch (error) {
        next(error);
    }
};
