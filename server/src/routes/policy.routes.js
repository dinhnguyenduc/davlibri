const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policy.controller');
const { asyncHandler } = require('../auth/checkAuth');
const { authUser } = require('../auth/checkAuth');

// Public routes
router.get('/get-policies', asyncHandler(policyController.getPolicies));

// Admin routes
router.get('/admin/get-all-policies', authUser, asyncHandler(policyController.getAllPolicies));
router.get('/admin/get-policy/:id', authUser, asyncHandler(policyController.getPolicyById));
router.post('/admin/create', authUser, asyncHandler(policyController.createPolicy));
router.put('/admin/update/:id', authUser, asyncHandler(policyController.updatePolicy));
router.delete('/admin/delete/:id', authUser, asyncHandler(policyController.deletePolicy));
router.patch('/admin/toggle-status/:id', authUser, asyncHandler(policyController.togglePolicyStatus));

module.exports = router;
