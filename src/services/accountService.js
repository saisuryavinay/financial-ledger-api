import { createAccount, getAccountById } from "../models/accountModel.js";
import { pool } from "../config/db.js";
import { createTransaction } from "../models/transactionModel.js";

// Create account service
export const createAccountService = async (data) => {
  return await createAccount(data);
};

// Get account details including calculated balance
export const getAccountDetailsService = async (accountId) => {
  const account = await getAccountById(accountId);
  if (!account) throw new Error("Account not found");

  const balanceQuery = `
    SELECT COALESCE(SUM(
      CASE WHEN entry_type='credit' THEN amount ELSE -amount END
    ),0) AS balance
    FROM ledger_entries
    WHERE account_id=$1
  `;
  const { rows } = await pool.query(balanceQuery, [accountId]);
  account.balance = parseFloat(rows[0].balance);
  return account;
};

// Get ledger entries for an account
export const getLedgerEntriesService = async (accountId) => {
  const account = await getAccountById(accountId);
  if (!account) throw new Error("Account not found");

  const ledgerQuery = `
    SELECT id, account_id, transaction_id, entry_type, amount, created_at
    FROM ledger_entries
    WHERE account_id=$1
    ORDER BY created_at ASC
  `;
  const { rows } = await pool.query(ledgerQuery, [accountId]);
  return rows;
};

// Deposit service - adds credit to account
export const depositService = async ({ account_id, amount, description }) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Lock the account
    const accountResult = await client.query(
      "SELECT id FROM accounts WHERE id = $1 FOR UPDATE",
      [account_id]
    );

    if (accountResult.rows.length === 0) {
      throw new Error("Account not found");
    }

    // Create transaction record
    const txResult = await client.query(
      `INSERT INTO transactions (type, destination_account_id, amount, currency, status, description)
       VALUES ('deposit', $1, $2, 'USD', 'completed', $3)
       RETURNING *`,
      [account_id, amount, description || 'Deposit']
    );
    const transaction = txResult.rows[0];

    // Create credit ledger entry
    await client.query(
      `INSERT INTO ledger_entries (account_id, transaction_id, entry_type, amount)
       VALUES ($1, $2, 'credit', $3)`,
      [account_id, transaction.id, amount]
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
