import express from 'express';
import { transferController } from '../controllers/transferController.js';

const router = express.Router();

// POST /transfers
router.post('/', transferController);

export default router;
