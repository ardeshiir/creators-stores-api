import { Router } from 'express';
import { uploadFile } from '../controllers/uploadController';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

router.post('/', upload.single('file'), uploadFile);

export default router;