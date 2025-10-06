// models/State.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IState extends Document {
    name: string;
    cities: {
        name?: string;
        districts?: number[]; // e.g. [1,2,3,4,...] (optional)
    }[];
}

const StateSchema = new Schema<IState>({
    name: { type: String, required: true, unique: true },
    cities: [
        {
            name: { type: String },
            districts: { type: [Number], default: [] }
        }
    ]
});

export const State = mongoose.model<IState>('State', StateSchema);
