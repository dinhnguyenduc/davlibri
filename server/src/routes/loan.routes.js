const express = require('express');
const router = express.Router();

const { asyncHandler, authUser } = require('../auth/checkAuth');

const loanController = require('../controllers/loan.controller');

// Loan Creation
router.post('/create', authUser, asyncHandler(loanController.createLoan));
router.post('/create-by-admin', authUser, asyncHandler(loanController.createLoanByAdmin));

// Payment Callbacks (Public - no auth required)
router.get('/check-payment-momo', asyncHandler(loanController.checkPaymentMomo));
router.get('/check-payment-vnpay', asyncHandler(loanController.checkPaymentVnpay));

// Loan Retrieval
router.get('/get-by-id', asyncHandler(loanController.getLoanById));
router.get('/get-by-user', authUser, asyncHandler(loanController.getLoanByUserId));
router.get('/get-all', authUser, asyncHandler(loanController.getLoansAdmin));
router.get('/get-all-admin', authUser, asyncHandler(loanController.getLoansAdmin));

// Special Queries
router.get('/active', authUser, asyncHandler(loanController.getActiveLoans));
router.get('/overdue', authUser, asyncHandler(loanController.getOverdueLoans));

// Loan Management
router.post('/update-status', authUser, asyncHandler(loanController.updateLoanStatus));
router.post('/cancel', authUser, asyncHandler(loanController.cancelLoan));
router.post('/delete', authUser, asyncHandler(loanController.deleteLoan));

// Return Process (Critical Feature)
router.post('/return-book', authUser, asyncHandler(loanController.returnBook));

module.exports = router;
