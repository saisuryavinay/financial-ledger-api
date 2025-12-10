import { createAccount, getAccountById } from "../models/accountModel.js";
import { pool } from "../config/db.js";

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
  account.balance = rows[0].balance;
  return account;
};
