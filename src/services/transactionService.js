import { pool } from "../config/db.js";

// Transfer money between accounts
export const transferService = async ({ source_account_id, destination_account_id, amount, currency, description }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1️⃣ Lock accounts and check source balance
    const sourceResult = await client.query(
      `SELECT id FROM accounts WHERE id = $1 FOR UPDATE`,
      [source_account_id]
    );
    if (sourceResult.rows.length === 0) {
      throw new Error("Source account not found");
    }

    const destResult = await client.query(
      `SELECT id FROM accounts WHERE id = $1 FOR UPDATE`,
      [destination_account_id]
    );
    if (destResult.rows.length === 0) {
      throw new Error("Destination account not found");
    }

    // Calculate source account balance from ledger
    const balanceResult = await client.query(
      `SELECT COALESCE(SUM(CASE WHEN entry_type='credit' THEN amount ELSE -amount END),0) AS balance
       FROM ledger_entries
       WHERE account_id=$1`,
      [source_account_id]
    );
    const sourceBalance = parseFloat(balanceResult.rows[0].balance);

    if (sourceBalance < amount) {
      throw new Error("Insufficient funds");
    }

    // 2️⃣ Create transaction record
    const txResult = await client.query(
      `INSERT INTO transactions (type, source_account_id, destination_account_id, amount, currency, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        'transfer',
        source_account_id,
        destination_account_id,
        amount,
        currency,
        'completed',
        description
      ]
    );
    const transaction = txResult.rows[0];

    // 3️⃣ Create ledger entries
    await client.query(
      `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount)
       VALUES ($1, $2, 'debit', $3)`,
      [source_account_id, transaction.id, amount]
    );

    await client.query(
      `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount)
       VALUES ($1, $2, 'credit', $3)`,
      [destination_account_id, transaction.id, amount]
    );

    await client.query('COMMIT');
    return transaction;

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
