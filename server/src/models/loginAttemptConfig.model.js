const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * LOGIN ATTEMPT CONFIG MODEL
 * Quản lý cấu hình giới hạn số lần đăng nhập sai
 */
const loginAttemptConfigSchema = new Schema(
    {
        /**
         * Có bật giới hạn đăng nhập không
         */
        enabled: {
            type: Boolean,
            default: true,
        },

        /**
         * Số lần đăng nhập sai tối đa
         */
        maxAttempts: {
            type: Number,
            default: 5,
            min: 1,
            max: 100,
        },

        /**
         * Thời gian khóa tài khoản (phút)
         */
        lockDuration: {
            type: Number,
            default: 30, // 30 phút
            min: 1,
            max: 1440, // 24 giờ
        },

        /**
         * Thời gian reset số lần đăng nhập sai (phút)
         */
        resetAfter: {
            type: Number,
            default: 60, // 1 giờ
            min: 1,
            max: 1440,
        },

        /**
         * Ghi chú
         */
        note: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('loginAttemptConfig', loginAttemptConfigSchema);
