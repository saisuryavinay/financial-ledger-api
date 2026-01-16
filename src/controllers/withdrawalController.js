import { pool } from "../config/db.js";
import { createTransaction, updateTransactionStatus } from "../models/transactionModel.js";
import { createLedgerEntry, getAccountBalance } from "../models/ledgerModel.js";

export const withdrawController = async (req, res) => {
  const { account_id, amount, description } = req.body;

  if (!account_id || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the account to prevent concurrent modifications
    const accountResult = await client.query(
      "SELECT id FROM accounts WHERE id = $1 FOR UPDATE",
      [account_id]
    );

    if (accountResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Account not found" });
    }

    // Calculate current balance from ledger entries
    const balanceResult = await client.query(
      `SELECT COALESCE(SUM(CASE WHEN entry_type='credit' THEN amount ELSE -amount END),0) AS balance
       FROM ledger_entries
       WHERE account_id=$1`,
      [account_id]
    );

    const currentBalance = parseFloat(balanceResult.rows[0].balance);

    if (currentBalance < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient funds" });
    }

    // Create transaction record
    const txResult = await client.query(
      `INSERT INTO transactions (type, source_account_id, amount, currency, status, description)
       VALUES ('withdrawal', $1, $2, 'USD', 'completed', $3)
       RETURNING *`,
      [account_id, amount, description]
    );
    const transaction = txResult.rows[0];

    // Create debit ledger entry
    await client.query(
      `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount)
       VALUES ($1, $2, 'debit', $3)`,
      [account_id, transaction.id, amount]
    );

    await client.query("COMMIT");

    res.status(200).json({ 
      message: "Withdrawal successful", 
      transaction_id: transaction.id,
      new_balance: currentBalance - amount 
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};
