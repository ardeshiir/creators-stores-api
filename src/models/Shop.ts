import mongoose, { Document, Schema } from 'mongoose';

interface IAttachment {
    type?: string; // e.g. banner type for signBoard
    dimensions?: { width: number; height: number };
    attachments: string[]; // image URLs
}

interface IEnvironment {
    stock: boolean;
    mainStreet: boolean;
    signBoard: IAttachment[];
}

interface IDisplayStand {
    type: string;
    brand: string;
    attachments: string[];
}

interface IShowCase {
    dimensions: { width: number; height: number };
    sticker: boolean;
    attachments: string[];
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
    propertyStatus: 'rental' | 'owned';
    name: string;
    familyName: string;
    mobile: string[];
    storeDescription: IStoreDescription;
    purchaseMethod: 'indirect' | 'direct';
    otherBrands: string[];
    address: IAddress;
    environment?: IEnvironment;
    displayStand?: IDisplayStand;
    showCase?: IShowCase[];
    externalImages?: string[][];
    internalImages?: string[][];
    description?: string;
    createdAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
    type: { type: String },
    dimensions: { width: Number, height: Number },
    attachments: [{ type: String }],
});

const EnviornmentSchema = new Schema<IEnvironment>({
    stock: { type: Boolean, required: true },
    mainStreet: { type: Boolean, required: true },
    signBoard: [AttachmentSchema],
});

const DisplayStandSchema = new Schema<IDisplayStand>({
    type: { type: String, required: true },
    brand: { type: String, required: true },
    attachments: [{ type: String }],
});

const ShowCaseSchema = new Schema<IShowCase>({
    dimensions: { width: Number, height: Number },
    sticker: { type: Boolean, required: true },
    attachments: [{ type: String }],
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

const ShopSchema = new Schema<IShop>({
    storeName: { type: String, required: true },
    storeCode: { type: String, required: true },
    propertyStatus: { type: String, enum: ['rental', 'owned'], required: true },
    name: { type: String, required: true },
    familyName: { type: String, required: true },
    mobile: [{ type: String }],
    storeDescription: StoreDescriptionSchema,
    purchaseMethod: { type: String, enum: ['indirect', 'direct'], required: true },
    otherBrands: [{ type: String }],
    address: AddressSchema,
    environment: EnviornmentSchema,
    displayStand: DisplayStandSchema,
    showCase: [ShowCaseSchema],
    externalImages: [[{ type: String }]],
    internalImages: [[{ type: String }]],
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export const Shop = mongoose.model<IShop>('Shop', ShopSchema);
