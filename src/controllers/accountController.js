import { createAccountService, getAccountDetailsService, getLedgerEntriesService, depositService } from "../services/accountService.js";

// POST /accounts
export const createAccountController = async (req, res) => {
  try {
    const data = req.body;
    const account = await createAccountService(data);
    res.status(201).json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /accounts/:id
export const getAccountController = async (req, res) => {
  try {
    const account = await getAccountDetailsService(req.params.id);
    res.json(account);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

// GET /accounts/:id/ledger
export const getLedgerEntriesController = async (req, res) => {
  try {
    const ledgerEntries = await getLedgerEntriesService(req.params.id);
    res.json(ledgerEntries);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

// POST /deposits
export const depositController = async (req, res) => {
  try {
    const { account_id, amount, description } = req.body;
    
    if (!account_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transaction = await depositService({
      account_id,
      amount,
      description
    });

    res.status(200).json({ 
      message: 'Deposit successful', 
      transaction_id: transaction.id 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
