import {S3Client, PutObjectCommand, ObjectCannedACL} from '@aws-sdk/client-s3';
import path from 'path';
import config from '../config/config';
import {Express} from "express";


const s3 = new S3Client({
    region: 'default',
    endpoint: 'https://s3.ir-thr-at1.arvanstorage.ir',
    credentials: {
        accessKeyId: config.s3AccessKeyId,
        secretAccessKey: config.s3SecretAccessKey,
    },
});

export const uploadToS3 = async (file: Express.Multer.File, bucket: string): Promise<string> => {
    const key = `${Date.now()}-${path.basename(file.originalname)}`;

    const uploadParams = {
        Bucket: bucket,
        Key: key,
        ACL: 'public-read' as ObjectCannedACL, // Optional: Makes file publicly readable
        Body: file.buffer,  // We’ll use multer memory storage to get buffer
        ContentType: file.mimetype,
    };

    await s3.send(new PutObjectCommand(uploadParams));

    // Return public file URL
    return `https://${bucket}.s3.ir-tbz-sh1.arvanstorage.ir/${key}`;
};
