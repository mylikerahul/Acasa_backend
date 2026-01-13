import express from 'express';
import * as transactionController from '../../controllers/transactions/transactions.controller.js';
import { isAuthenticated, isAdmin } from '../../guards/guards.js';

const router = express.Router();

// Create new Transaction (Authenticated User)
router.post(
  '/create', 
  isAuthenticated, 
  transactionController.createTransaction
);

// Get All Transactions (Admin Only)
router.get(
  '/all', 
  isAuthenticated, 
  isAdmin, 
  transactionController.getAllTransactions
);

// Get My Transactions (Logged in User)
router.get(
  '/my-transactions', 
  isAuthenticated, 
  transactionController.getMyTransactions
);

// Get, Update, Delete by ID
router.route('/:id')
  .get(isAuthenticated, transactionController.getTransactionById)
  // Update/Delete usually restricted to Admin for financial records
  .put(isAuthenticated, isAdmin, transactionController.updateTransaction)
  .delete(isAuthenticated, isAdmin, transactionController.deleteTransaction);

export default router;