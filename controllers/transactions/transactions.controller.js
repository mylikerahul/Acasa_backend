import * as TransactionModel from "../../models/transactions/transactions.model.js";
import catchAsyncErrors from "../../middleware/catchAsyncErrors.js";
import ErrorHandler from "../../utils/errorHandler.js";

/* =========================================================
   CREATE TRANSACTION
========================================================= */
export const createTransaction = catchAsyncErrors(async (req, res, next) => {
  const { property_id, payment_amount, gateway, payment_id } = req.body;
  const user_id = req.user ? req.user.id : req.body.user_id; // Prefer logged in user
  const email = req.user ? req.user.email : req.body.email;

  if (!payment_amount || !gateway || !payment_id) {
    return next(new ErrorHandler("Payment amount, gateway, and payment ID are required", 400));
  }

  const transactionData = {
    ...req.body,
    user_id,
    email
  };

  const result = await TransactionModel.createTransaction(transactionData);

  res.status(201).json({
    success: true,
    message: "Transaction recorded successfully",
    data: {
      id: result.insertId,
      ...transactionData
    }
  });
});

/* =========================================================
   GET ALL TRANSACTIONS (Admin)
========================================================= */
export const getAllTransactions = catchAsyncErrors(async (req, res, next) => {
  const transactions = await TransactionModel.getAllTransactions();

  res.status(200).json({
    success: true,
    count: transactions.length,
    transactions
  });
});

/* =========================================================
   GET MY TRANSACTIONS
========================================================= */
export const getMyTransactions = catchAsyncErrors(async (req, res, next) => {
  const transactions = await TransactionModel.getTransactionsByUserId(req.user.id);

  res.status(200).json({
    success: true,
    count: transactions.length,
    transactions
  });
});

/* =========================================================
   GET TRANSACTION BY ID
========================================================= */
export const getTransactionById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const transaction = await TransactionModel.getTransactionById(id);

  if (!transaction) {
    return next(new ErrorHandler(`Transaction not found with id: ${id}`, 404));
  }

  // Authorization: Only owner or admin can view details
  if (transaction.user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorHandler("Not authorized to view this transaction", 403));
  }

  res.status(200).json({
    success: true,
    transaction
  });
});

/* =========================================================
   UPDATE TRANSACTION (Admin only usually)
========================================================= */
export const updateTransaction = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existing = await TransactionModel.getTransactionById(id);
  if (!existing) {
    return next(new ErrorHandler(`Transaction not found with id: ${id}`, 404));
  }

  const updateData = {
    property_id: req.body.property_id || existing.property_id,
    user_id: req.body.user_id || existing.user_id,
    email: req.body.email || existing.email,
    gateway: req.body.gateway || existing.gateway,
    payment_amount: req.body.payment_amount || existing.payment_amount,
    payment_id: req.body.payment_id || existing.payment_id,
    date: req.body.date || existing.date
  };

  await TransactionModel.updateTransaction(id, updateData);

  res.status(200).json({
    success: true,
    message: "Transaction updated successfully",
    data: updateData
  });
});

/* =========================================================
   DELETE TRANSACTION
========================================================= */
export const deleteTransaction = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const existing = await TransactionModel.getTransactionById(id);
  if (!existing) {
    return next(new ErrorHandler(`Transaction not found with id: ${id}`, 404));
  }

  await TransactionModel.deleteTransaction(id);

  res.status(200).json({
    success: true,
    message: "Transaction deleted successfully"
  });
});