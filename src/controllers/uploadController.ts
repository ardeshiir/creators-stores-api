import { Request, Response, NextFunction } from 'express';
import { uploadToS3 } from '../utils/s3';

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = await uploadToS3(req.file, 'creators');

        res.status(200).json({ url: fileUrl });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'File upload failed', error });
    }
};
