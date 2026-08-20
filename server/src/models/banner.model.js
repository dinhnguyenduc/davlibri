const mongoose = require('mongoose');

const { Schema } = mongoose;

const bannerSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        subtitle: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
            required: true, // URL của hình ảnh banner
        },
        link: {
            type: String,
            default: '#', // Link khi click vào banner
        },
        buttonText: {
            type: String,
            default: 'Xem thêm',
        },
        order: {
            type: Number,
            default: 0, // Thứ tự hiển thị (số nhỏ hơn hiện trước)
        },
        isActive: {
            type: Boolean,
            default: true, // Bật/tắt banner
        },
        features: [
            {
                type: String,
            },
        ], // Danh sách tính năng để hiển thị
        backgroundColor: {
            type: String,
            default: '#f8f9fa', // Màu nền banner
        },
        textColor: {
            type: String,
            default: '#333333', // Màu chữ
        },
        imagePositionX: {
            type: String,
            enum: ['left', 'center', 'right'],
            default: 'center', // Vị trí ngang của ảnh
        },
        imagePositionY: {
            type: String,
            enum: ['top', 'center', 'bottom'],
            default: 'center', // Vị trí dọc của ảnh
        },
        imageSize: {
            type: String,
            enum: ['cover', 'contain', 'auto', '100% 100%'],
            default: '100% 100%', // Cách ảnh fill vào khung
        },
        imageOffsetX: {
            type: Number,
            default: 50, // Vị trí chính xác theo % ngang (0-100)
            min: 0,
            max: 100,
        },
        imageOffsetY: {
            type: Number,
            default: 50, // Vị trí chính xác theo % dọc (0-100)
            min: 0,
            max: 100,
        },
        showTitle: {
            type: Boolean,
            default: false, // Hiển thị tiêu đề
        },
    },
    {
        timestamps: true,
    },
);

// Index để sắp xếp theo order
bannerSchema.index({ order: 1, isActive: 1 });

module.exports = mongoose.model('banners', bannerSchema);
