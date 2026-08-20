const express = require('express');
const router = express.Router();

const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');
const chatbotController = require('../controllers/chatbot.controller');

// Public routes - User có thể sử dụng
router.post('/ask', asyncHandler(chatbotController.askQuestion));
router.get('/faqs', asyncHandler(chatbotController.getPublicFAQs));
router.get('/answer/:id', asyncHandler(chatbotController.getAnswerById));

// Admin routes - Chỉ admin mới được truy cập
router.post('/admin/faq', authAdmin, asyncHandler(chatbotController.createFAQ));
router.get('/admin/faqs', authAdmin, asyncHandler(chatbotController.getAllFAQs));
router.put('/admin/faq/:id', authAdmin, asyncHandler(chatbotController.updateFAQ));
router.delete('/admin/faq/:id', authAdmin, asyncHandler(chatbotController.deleteFAQ));
router.patch('/admin/faq/:id/toggle', authAdmin, asyncHandler(chatbotController.toggleFAQStatus));

// Bulk operations
router.post('/admin/faqs/bulk-delete', authAdmin, asyncHandler(chatbotController.bulkDeleteFAQs));
router.post('/admin/faqs/import', authAdmin, asyncHandler(chatbotController.importFAQs));

module.exports = router;
