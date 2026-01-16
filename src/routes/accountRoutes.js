import express from "express";
import { createAccountController, getAccountController, getLedgerEntriesController, depositController } from "../controllers/accountController.js";

const router = express.Router();

// Create new account
router.post("/", createAccountController);

// Get ledger entries for an account (before /:id to avoid conflicts)
router.get("/:id/ledger", getLedgerEntriesController);

// Get account details with calculated balance
router.get("/:id", getAccountController);

// Deposit to account
router.post("/deposits", depositController);

export default router;
