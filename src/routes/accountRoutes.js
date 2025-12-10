import express from "express";
import { createAccountController, getAccountController } from "../controllers/accountController.js";

const router = express.Router();

// Create new account
router.post("/", createAccountController);

// Get account details
router.get("/:id", getAccountController);

export default router;
