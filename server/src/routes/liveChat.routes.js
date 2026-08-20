const express = require('express');
const router = express.Router();
const { asyncHandler, authUser, authLibrarian } = require('../auth/checkAuth');
const liveChatController = require('../controllers/liveChat.controller');

// User routes
router.post('/create-request', authUser, asyncHandler(liveChatController.createChatRequest));
router.get('/active', authUser, asyncHandler(liveChatController.getActiveChat));
router.get('/history/:chatId', authUser, asyncHandler(liveChatController.getChatHistory));
router.post('/send-message', authUser, asyncHandler(liveChatController.sendMessage));
router.post('/close', authUser, asyncHandler(liveChatController.closeChat));
router.post('/rate', authUser, asyncHandler(liveChatController.rateChat));
router.post('/mark-read', authUser, asyncHandler(liveChatController.markAsRead));

// Librarian routes
router.get('/waiting', authLibrarian, asyncHandler(liveChatController.getWaitingChats));
router.post('/accept', authLibrarian, asyncHandler(liveChatController.acceptChat));
router.get('/my-chats', authLibrarian, asyncHandler(liveChatController.getLibrarianChats));

module.exports = router;
