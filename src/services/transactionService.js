import { pool } from "../config/db.js";
import { createTransaction, updateTransactionStatus } from "../models/transactionModel.js";
import { createLedgerEntry, getAccountBalance } from "../models/ledgerModel.js";

// Transfer money between accounts
export const transferService = async ({ source_account_id, destination_account_id, amount, currency, description }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1️⃣ Check source balance
    const sourceBalance = await getAccountBalance(source_account_id);
    if (sourceBalance < amount) throw new Error("Insufficient funds");

    // 2️⃣ Create transaction record
    const transaction = await createTransaction({
      type: 'transfer',
      source_account_id,
      destination_account_id,
      amount,
      currency,
      status: 'pending',
      description
    });

    // 3️⃣ Create ledger entries
    await createLedgerEntry({ account_id: source_account_id, transaction_id: transaction.id, entry_type: 'debit', amount });
    await createLedgerEntry({ account_id: destination_account_id, transaction_id: transaction.id, entry_type: 'credit', amount });

    // 4️⃣ Update transaction status to completed
    await updateTransactionStatus(transaction.id, 'completed');

    await client.query('COMMIT');
    return transaction;

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
