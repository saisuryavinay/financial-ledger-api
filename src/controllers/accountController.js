import { createAccountService, getAccountDetailsService } from "../services/accountService.js";


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
