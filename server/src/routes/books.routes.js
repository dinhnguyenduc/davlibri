const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');

const { asyncHandler, authUser } = require('../auth/checkAuth');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads/books');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

var upload = multer({ storage: storage });

const booksController = require('../controllers/books.controller');

// Image Management
router.post('/upload-images', authUser, upload.array('images'), asyncHandler(booksController.uploadImages));
router.post('/delete-image', authUser, asyncHandler(booksController.deleteImage));

// CRUD Operations
router.post('/add', authUser, asyncHandler(booksController.addBook));
router.get('/get-all', asyncHandler(booksController.getAllBooks));
router.get('/get-by-id', asyncHandler(booksController.getBookById));
router.post('/update', authUser, asyncHandler(booksController.updateBook));
router.post('/delete', authUser, asyncHandler(booksController.deleteBook));

// Search & Filter
router.get('/search', asyncHandler(booksController.searchBooks));
router.get('/filter', asyncHandler(booksController.filterBooks));

// Special Queries
router.get('/available', asyncHandler(booksController.getAvailableBooks));
router.get('/popular', asyncHandler(booksController.getPopularBooks));
router.get('/featured', asyncHandler(booksController.getFeaturedBooks));

// Analytics
router.post('/increment-view', asyncHandler(booksController.incrementViewCount));

module.exports = router;
