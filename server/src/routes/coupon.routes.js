const express = require('express');
const router = express.Router();

const { asyncHandler, authUser } = require('../auth/checkAuth');
const couponController = require('../controllers/coupon.controller');

// Admin routes
router.post('/create', authUser, asyncHandler(couponController.createCoupon));
router.get('/get-all', authUser, asyncHandler(couponController.getAllCoupons));
router.get('/get-by-id', authUser, asyncHandler(couponController.getCouponById));
router.post('/update', authUser, asyncHandler(couponController.updateCoupon));
router.post('/delete', authUser, asyncHandler(couponController.deleteCoupon));
router.post('/toggle-status', authUser, asyncHandler(couponController.toggleStatus));

// User routes
router.post('/apply', authUser, asyncHandler(couponController.applyCoupon));
router.post('/increment-usage', authUser, asyncHandler(couponController.incrementUsage));

module.exports = router;
