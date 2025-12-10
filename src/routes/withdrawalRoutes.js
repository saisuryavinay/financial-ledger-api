import express from 'express';
import { withdrawController } from '../controllers/withdrawalController.js';

const router = express.Router();

// POST /withdrawals
router.post('/', withdrawController);

export default router;
