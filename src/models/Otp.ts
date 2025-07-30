// models/Otp.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
    phone: string;
    code: string;
    expiresAt: Date;
}

const OtpSchema = new Schema<IOtp>({
    phone: { type: String, required: true },
    code: { type: String, required: true }, // hashed OTP
    expiresAt: { type: Date, required: true, expires: 0 } // TTL index
});

export const Otp = mongoose.model<IOtp>('Otp', OtpSchema);
