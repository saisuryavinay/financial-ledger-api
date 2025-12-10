import { pool } from "../config/db.js";

// Create transaction record
export const createTransaction = async ({ type, source_account_id, destination_account_id, amount, currency, status, description }) => {
  const query = `
    INSERT INTO transactions (type, source_account_id, destination_account_id, amount, currency, status, description)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *;
  `;
  const values = [type, source_account_id, destination_account_id, amount, currency, status, description];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Update transaction status
export const updateTransactionStatus = async (transaction_id, status) => {
  const query = `
    UPDATE transactions SET status=$1 WHERE id=$2 RETURNING *;
  `;
  const { rows } = await pool.query(query, [status, transaction_id]);
  return rows[0];
};
