import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    jwtSecret: string;
    s3AccessKeyId: string;
    s3SecretAccessKey: string;
    kavenegarApiKey: string;
}

const config: Config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'supersecretkey',
    s3AccessKeyId: process.env.S3_ACCESS_KEY as string,
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    kavenegarApiKey:'54573162667574556B4165416E3537314B4236534E6645337339414D73455631346A353839494E755176593D'
};

export default config;