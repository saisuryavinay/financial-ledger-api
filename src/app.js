import express from 'express';
import accountRoutes from './routes/accountRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';

const app = express();
app.use(express.json());

app.use('/accounts', accountRoutes);
app.use('/transactions', transactionRoutes);
app.use('/transfer', transferRoutes);
app.use('/withdrawal', withdrawalRoutes);

app.get('/', (req, res) => {
  res.send('Financial Ledger API Running...');
});

export default app;
