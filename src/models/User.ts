import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name?: string;
    phone: string;
    role: 'admin' | 'manager' | 'user';
    permissions: string[];
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String },
    phone: { type: String, required: true, unique: true },
    role: {
        type: String,
        enum: ['admin', 'manager', 'user'],
        default: 'user'
    },
    permissions: { type: [String], default: [] }, // e.g., ['CREATE_SHOP', 'DELETE_USER']
    createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>('User', UserSchema);
