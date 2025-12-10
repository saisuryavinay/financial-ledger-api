import { pool } from "../config/db.js";

// Create ledger entry (immutable)
export const createLedgerEntry = async ({ account_id, transaction_id, entry_type, amount }) => {
  const query = `
    INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [account_id, transaction_id, entry_type, amount];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Get account balance from ledger
export const getAccountBalance = async (account_id) => {
  const query = `
    SELECT COALESCE(SUM(CASE WHEN entry_type='credit' THEN amount ELSE -amount END),0) AS balance
    FROM ledger_entries
    WHERE account_id=$1
  `;
  const { rows } = await pool.query(query, [account_id]);
  return parseFloat(rows[0].balance);
};
