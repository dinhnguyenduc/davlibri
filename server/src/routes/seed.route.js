const express = require('express');
const router = express.Router();
const seedController = require('../controllers/seed.controller');
const { authAdmin } = require('../auth/checkAuth');

// All routes require admin authentication
router.use(authAdmin);

// Seed individual data types
router.post('/users', seedController.seedUsers);
router.post('/payments', seedController.seedPayments);
router.post('/loans', seedController.seedLoans);
router.post('/update-book-stats', seedController.updateBookStats);

// Seed all data at once
router.post('/all', seedController.seedAll);

// Clear demo data
router.delete('/clear', seedController.clearDemoData);

// Get statistics
router.get('/stats', seedController.getStats);

module.exports = router;
