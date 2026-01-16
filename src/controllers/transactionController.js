import { transferService } from '../services/transactionService.js';

export const transferController = async (req, res) => {
  const { source_account_id, destination_account_id, amount, currency, description } = req.body;

  if (!source_account_id || !destination_account_id || !amount || !currency) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const transaction = await transferService({
      source_account_id,
      destination_account_id,
      amount,
      currency,
      description
    });
    res.status(200).json({ message: 'Transfer successful', transaction_id: transaction.id });
  } catch (error) {
    console.error('TRANSFER ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};
