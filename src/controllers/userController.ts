import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

// Create a user
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;
        const newUser = await User.create({ name, email, password });
        res.status(201).json(newUser);
    } catch (error) {
        next(error);
    }
};

// Get all users
export const getUsers = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        next(error);
    }
};

// Update user
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

// Delete user
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found' });
        res.json(deletedUser);
    } catch (error) {
        next(error);
    }
};
