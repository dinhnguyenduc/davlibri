const express = require('express');
const router = express.Router();

const { asyncHandler, authUser } = require('../auth/checkAuth');

const borrowingCartController = require('../controllers/borrowingCart.controller');

// Cart Management
router.post('/add', authUser, asyncHandler(borrowingCartController.createCart));
router.get('/get', authUser, asyncHandler(borrowingCartController.getCart));
router.put('/update-quantity', authUser, asyncHandler(borrowingCartController.updateQuantity));
router.post('/remove-item', authUser, asyncHandler(borrowingCartController.deleteItem));

// Cart Information
router.post('/update-info', authUser, asyncHandler(borrowingCartController.updateInfoCart));
router.put('/update-dates', authUser, asyncHandler(borrowingCartController.updateBorrowingDates));

// Checkout Process
router.post('/place-request', authUser, asyncHandler(borrowingCartController.placeBorrowingRequest));

module.exports = router;
