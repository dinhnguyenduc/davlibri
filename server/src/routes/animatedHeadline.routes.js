const express = require('express');
const router = express.Router();
const headlineController = require('../controllers/animatedHeadline.controller');
const { asyncHandler } = require('../auth/checkAuth');
const { authUser } = require('../auth/checkAuth');

// Public routes - Lấy headlines đang active
router.get('/get-headlines', asyncHandler(headlineController.getHeadlines));

// Admin routes - Yêu cầu authentication
router.get('/admin/get-all-headlines', authUser, asyncHandler(headlineController.getAllHeadlines));
router.get('/admin/get-headline/:id', authUser, asyncHandler(headlineController.getHeadlineById));
router.post('/admin/create', authUser, asyncHandler(headlineController.createHeadline));
router.put('/admin/update/:id', authUser, asyncHandler(headlineController.updateHeadline));
router.delete('/admin/delete/:id', authUser, asyncHandler(headlineController.deleteHeadline));
router.patch('/admin/toggle-status/:id', authUser, asyncHandler(headlineController.toggleHeadlineStatus));

module.exports = router;
