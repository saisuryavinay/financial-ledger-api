import { pool } from "../config/db.js";

// Example: get all accounts
export const getAccounts = async () => {
  try {
    const result = await pool.query("SELECT * FROM accounts");
    return result.rows;
  } catch (err) {
    console.error("Error fetching accounts:", err);
    throw err;
  }
};

// Example: create a new account
export const createAccount = async (name, balance) => {
  try {
    const result = await pool.query(
      "INSERT INTO accounts (name, balance) VALUES ($1, $2) RETURNING *",
      [name, balance]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Error creating account:", err);
    throw err;
  }
};
