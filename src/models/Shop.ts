import mongoose, { Document, Schema, Types } from 'mongoose';
import AutoIncrementFactory from 'mongoose-sequence';
import {IUser} from "./User";

interface IAttachment {
    type?: string; // e.g. banner type for signBoard
    dimensions?: { width: number; height: number };
    attachments: string; // image URL
}

interface IDisplayStand {
    type: string;
    brand: string;
    attachments: string;
}

interface IShowCase {
    dimensions: { width: number; height: number };
    sticker: boolean;
    attachments: string;
}

interface IAddress {
    state: string;
    city: string;
    description: string;
    postalcode: string;
    phoneNumber: string[];
    location: { lat: string; lon: string };
    landLine: string;
}

interface IStoreDescription {
    area: number;
    activityHistory: number;
    cooperationHistory: number;
    sellerType: string;
}

export interface IShop extends Document {
    storeName: string;
    storeCode: string;
    propertyStatus: "rental" | "owner"; // ⚠️ I fixed "owned" → "owner" to match schema
    name: string;
    familyName: string;
    mobile: string[];
    storeDescription: IStoreDescription;
    purchaseMethod: "indirect" | "direct";
    otherBrands: string[];
    address: IAddress;
    stock: boolean;
    mainStreet: boolean;
    signBoard: IAttachment[];
    displayStand?: IDisplayStand;
    showCase?: IShowCase[];
    externalImages?: string[];
    internalImages?: string[];
    description?: string;
    createdAt: Date;

    // new fields
    specialist: Types.ObjectId | IUser; // reference to User
    verified: boolean;
}

const AttachmentSchema = new Schema<IAttachment>({
    type: { type: String },
    dimensions: { width: Number, height: Number },
    attachments: [{ type: String }],
});


const DisplayStandSchema = new Schema<IDisplayStand>({
    type: { type: String  },
    brand: { type: String  },
    attachments: [{ type: String }],
});

const ShowCaseSchema = new Schema<IShowCase>({
    dimensions: { width: Number, height: Number },
    sticker: { type: Boolean, required: true },
    attachments: { type: String },
});

const AddressSchema = new Schema<IAddress>({
    state: String,
    city: String,
    description: String,
    postalcode: String,
    phoneNumber: [String],
    location: { lat: String, lon: String },
    landLine: String,
});

const StoreDescriptionSchema = new Schema<IStoreDescription>({
    area: Number,
    activityHistory: Number,
    cooperationHistory: Number,
    sellerType: String,
});
// @ts-ignore
const AutoIncrement = AutoIncrementFactory(mongoose);

const ShopSchema = new Schema<IShop>({
    storeName: { type: String, required: true },
    storeCode: { type: String, required: true },
    propertyStatus: { type: String, enum: ['rental', 'owner'], required: true },
    name: { type: String, required: true },
    familyName: { type: String, required: true },
    mobile: [{ type: String }],
    storeDescription: StoreDescriptionSchema,
    purchaseMethod: { type: String, enum: ['indirect', 'direct'], required: true },
    otherBrands: [{ type: String }],
    address: AddressSchema,
    stock: { type: Boolean, required: true },
    mainStreet: { type: Boolean, required: true },
    signBoard: [AttachmentSchema],
    displayStand: DisplayStandSchema,
    showCase: [ShowCaseSchema],
    externalImages: [{ type: String }],
    internalImages: [{ type: String }],
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    // specialist reference
    specialist: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // verification status
    verified: { type: Boolean, default: false },
});

// ✅ Add incremental "shopId"
// @ts-ignore
ShopSchema.plugin(AutoIncrement, { inc_field: 'shopId', start_seq: 1000 });

export const Shop = mongoose.model<IShop>('Shop', ShopSchema);
