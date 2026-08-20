const express = require('express');
const router = express.Router();

const multer = require('multer');
const path = require('path');

const { asyncHandler, authUser } = require('../auth/checkAuth');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads/banners');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

const bannerController = require('../controllers/banner.controller');

// Public routes (không cần authentication)
router.get('/get-banners', asyncHandler(bannerController.getBanners));
router.get('/get-banner-by-id/:id', asyncHandler(bannerController.getBannerById));

// Admin routes (cần authentication)
router.get('/admin/get-all-banners', authUser, asyncHandler(bannerController.getAllBanners));
router.post('/admin/upload-image', authUser, upload.single('image'), asyncHandler(bannerController.uploadBannerImage));
router.post('/admin/create', authUser, asyncHandler(bannerController.createBanner));
router.put('/admin/update/:id', authUser, asyncHandler(bannerController.updateBanner));
router.delete('/admin/delete/:id', authUser, asyncHandler(bannerController.deleteBanner));
router.patch('/admin/toggle-status/:id', authUser, asyncHandler(bannerController.toggleBannerStatus));
router.post('/admin/update-order', authUser, asyncHandler(bannerController.updateBannerOrder));

module.exports = router;
