const express = require('express');
const router = express.Router();
const emailConfigController = require('../controllers/emailConfig.controller');
const { authAdmin } = require('../auth/checkAuth');

// Tất cả routes đều yêu cầu quyền admin
router.use(authAdmin);

// Lấy cấu hình email hiện tại
router.get('/config', emailConfigController.getConfig);

// Cập nhật cấu hình email
router.put('/config', emailConfigController.updateConfig);

// Lấy thống kê
router.get('/stats', emailConfigController.getStats);

// Lấy hướng dẫn
router.get('/guide', emailConfigController.getGuide);

// Test gửi email @dav.edu.vn
router.post('/test-dav', emailConfigController.testDavEmail);

// Test gửi email Gmail
router.post('/test-gmail', emailConfigController.testGmailEmail);

module.exports = router;
