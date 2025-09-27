import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    name?: string;
    family?: string;
    phone: string;
    role: "field_agent" | "regional_manager" | "global_manager";
    permissions: string[];
    createdAt: Date;

    identifierCode: string;

    state?: string;
    city?: string;
    district?: number;
    isActive: boolean;
}

const UserSchema = new Schema<IUser>({
    name: { type: String },
    family: { type: String },
    phone: { type: String, required: true, unique: true },
    role: {
        type: String,
        enum: ["field_agent", "regional_manager", "global_manager"],
        required: true,
        default: "field_agent",
    },
    permissions: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },

    identifierCode: { type: String },

    state: { type: String },
    city: { type: String },
    district: { type: Number },
    isActive: { type: Boolean, default: true },
});

export const User = mongoose.model<IUser>("User", UserSchema);
