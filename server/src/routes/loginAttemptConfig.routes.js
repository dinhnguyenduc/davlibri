const express = require('express');
const router = express.Router();

const { asyncHandler, authAdmin } = require('../auth/checkAuth');
const loginAttemptConfigController = require('../controllers/loginAttemptConfig.controller');

// Tất cả routes yêu cầu quyền admin
router.use(authAdmin);

// Lấy cấu hình
router.get('/config', asyncHandler(loginAttemptConfigController.getConfig));

// Cập nhật cấu hình
router.put('/config', asyncHandler(loginAttemptConfigController.updateConfig));

// Reset số lần đăng nhập sai cho 1 user
router.post('/reset-user', asyncHandler(loginAttemptConfigController.resetUserAttempts));

// Reset tất cả user bị khóa
router.post('/reset-all', asyncHandler(loginAttemptConfigController.resetAllLocked));

// Lấy danh sách user bị khóa
router.get('/locked-users', asyncHandler(loginAttemptConfigController.getLockedUsers));

// Lấy thống kê
router.get('/stats', asyncHandler(loginAttemptConfigController.getStats));

module.exports = router;
