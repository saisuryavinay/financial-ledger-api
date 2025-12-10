import express from 'express';
import transactionRoutes from './routes/transactionRoutes.js';
import { transferController } from './controllers/transferController.js';

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Direct route for Step 6 & Step 7 testing
app.post('/transfer', transferController);

app.use('/transactions', transactionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
