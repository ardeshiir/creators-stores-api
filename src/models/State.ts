import mongoose, { Schema, Document } from "mongoose";

export interface IState extends Document {
    name: string;
    cities: string[];
}

const StateSchema = new Schema<IState>({
    name: { type: String, required: true, unique: true },
    cities: [{ type: String }],
});

export const State = mongoose.model<IState>("State", StateSchema);
