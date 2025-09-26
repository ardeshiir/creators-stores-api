import { Request, Response, NextFunction } from "express";
import { State } from "../models/State";

// Get all states with their cities
export const getStates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const states = await State.find().sort({ name: 1 });
        res.json(states);
    } catch (error) {
        next(error);
    }
};

// Get one state by ID
export const getStateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const state = await State.findById(id);
        if (!state) {
            return res.status(404).json({ message: "State not found" });
        }
        res.json(state);
    } catch (error) {
        next(error);
    }
};

// (Optional) Get one state by name
export const getStateByName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name } = req.params;
        const state = await State.findOne({ name });
        if (!state) {
            return res.status(404).json({ message: "State not found" });
        }
        res.json(state);
    } catch (error) {
        next(error);
    }
};
