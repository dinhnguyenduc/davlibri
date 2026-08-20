const express = require('express');
const router = express.Router();

const { asyncHandler, authAdmin } = require('../auth/checkAuth');
const chatbotConfigController = require('../controllers/chatbotConfig.controller');

// ============ API KEY ROUTES ============
router.post('/api-keys', authAdmin, asyncHandler(chatbotConfigController.createApiKey));
router.get('/api-keys', authAdmin, asyncHandler(chatbotConfigController.getAllApiKeys));
router.get('/api-keys/active', authAdmin, asyncHandler(chatbotConfigController.getActiveApiKey));
router.get('/api-keys/:id/stats', authAdmin, asyncHandler(chatbotConfigController.getApiKeyStats));
router.put('/api-keys/:id', authAdmin, asyncHandler(chatbotConfigController.updateApiKey));
router.delete('/api-keys/:id', authAdmin, asyncHandler(chatbotConfigController.deleteApiKey));

// ============ POLICY ROUTES ============
router.post('/policies', authAdmin, asyncHandler(chatbotConfigController.createPolicy));
router.get('/policies', authAdmin, asyncHandler(chatbotConfigController.getAllPolicies));
router.get('/policies/active', authAdmin, asyncHandler(chatbotConfigController.getActivePolicy));
router.put('/policies/:id', authAdmin, asyncHandler(chatbotConfigController.updatePolicy));
router.delete('/policies/:id', authAdmin, asyncHandler(chatbotConfigController.deletePolicy));

// ============ CONTEXT DICTIONARY ROUTES ============
router.post('/context-terms', authAdmin, asyncHandler(chatbotConfigController.addContextTerm));
router.get('/context-terms', authAdmin, asyncHandler(chatbotConfigController.getAllContextTerms));
router.put('/context-terms/:id', authAdmin, asyncHandler(chatbotConfigController.updateContextTerm));
router.delete('/context-terms/:id', authAdmin, asyncHandler(chatbotConfigController.deleteContextTerm));

module.exports = router;
