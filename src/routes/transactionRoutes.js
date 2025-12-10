import express from 'express';
import { transferController } from '../controllers/transactionController.js';

const router = express.Router();

// POST /transfer
router.post('/transfer', transferController);

export default router;
