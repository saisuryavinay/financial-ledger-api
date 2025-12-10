import { pool } from "../config/db.js";

export const withdrawController = async (req, res) => {
  const { account_id, amount } = req.body;

  if (!account_id || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Begin transaction
    await pool.query("BEGIN");

    // Get current balance
    const balanceResult = await pool.query(
      "SELECT balance FROM accounts WHERE id = $1 FOR UPDATE",
      [account_id]
    );

    if (balanceResult.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Account not found" });
    }

    const currentBalance = balanceResult.rows[0].balance;

    if (currentBalance < amount) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient funds" });
    }

    // Update balance
    const newBalance = currentBalance - amount;
    await pool.query(
      "UPDATE accounts SET balance = $1 WHERE id = $2",
      [newBalance, account_id]
    );

    // Commit transaction
    await pool.query("COMMIT");

    res.status(200).json({ message: "Withdrawal successful", balance: newBalance });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
