import { pool } from "../config/db.js";

// Get all accounts
export const getAccounts = async () => {
  try {
    const result = await pool.query("SELECT * FROM accounts");
    return result.rows;
  } catch (err) {
    console.error("Error fetching accounts:", err);
    throw err;
  }
};

// Get account by ID
export const getAccountById = async (accountId) => {
  try {
    const result = await pool.query("SELECT * FROM accounts WHERE id = $1", [accountId]);
    return result.rows[0];
  } catch (err) {
    console.error("Error fetching account:", err);
    throw err;
  }
};

// Create a new account
export const createAccount = async ({ user_id, account_type, currency, status = 'active' }) => {
  try {
    const result = await pool.query(
      "INSERT INTO accounts (user_id, account_type, currency, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [user_id, account_type, currency, status]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Error creating account:", err);
    throw err;
  }
};
