import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name?: string;
    phone: string;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String },
    phone: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>('User', UserSchema);
