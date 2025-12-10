import db from '../config/db.js';

export const transferController = async (req, res) => {
  const { source_account_id, destination_account_id, amount, currency, description } = req.body;

  if (!source_account_id || !destination_account_id || !amount || !currency) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await db.query('BEGIN');

    // Lock source account
    const sourceResult = await db.query(
      'SELECT balance FROM accounts WHERE id=$1 FOR UPDATE',
      [source_account_id]
    );
    if (sourceResult.rows.length === 0) throw new Error('Source account not found');
    if (sourceResult.rows[0].balance < amount) throw new Error('Insufficient balance');

    // Lock destination account
    const destResult = await db.query(
      'SELECT balance FROM accounts WHERE id=$1 FOR UPDATE',
      [destination_account_id]
    );
    if (destResult.rows.length === 0) throw new Error('Destination account not found');

    // Update balances
    await db.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, source_account_id]);
    await db.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, destination_account_id]);

    // Insert transaction
    const txResult = await db.query(
      `INSERT INTO transactions
        (type, source_account_id, destination_account_id, amount, currency, status, description)
       VALUES ('transfer', $1, $2, $3, $4, 'completed', $5)
       RETURNING id`,
      [source_account_id, destination_account_id, amount, currency, description]
    );
    const transaction_id = txResult.rows[0].id;

    // Insert ledger entries
    await db.query(
      `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount)
       VALUES ($1, $2, 'debit', $3)`,
      [source_account_id, transaction_id, amount]
    );
    await db.query(
      `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount)
       VALUES ($1, $2, 'credit', $3)`,
      [destination_account_id, transaction_id, amount]
    );

    await db.query('COMMIT');
    res.status(200).json({ message: 'Transfer successful' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('TRANSFER ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};
