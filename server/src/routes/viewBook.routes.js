const express = require('express');
const router = express.Router();

const { asyncHandler, authUser } = require('../auth/checkAuth');

const viewBookController = require('../controllers/viewBook.controller');

router.post('/create', authUser, asyncHandler(viewBookController.createViewBook));
router.get('/get-view-book', authUser, asyncHandler(viewBookController.getViewBook));

module.exports = router;
