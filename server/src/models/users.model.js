const mongoose = require('mongoose');

const { Schema } = mongoose;

const usersSchema = new Schema(
    {
        fullName: { type: String, require: true },
        email: { type: String, require: true, unique: true },
        password: { type: String, require: true },
        phone: { type: String, require: true },
        role: { type: String, require: true, enum: ['admin', 'librarian', 'user'], default: 'user' },
        avatar: { type: String, require: true, default: 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png' },
        address: { type: String, require: true },
        permissions: {
            type: [String],
            enum: ['manage_categories', 'manage_products', 'manage_coupons', 'manage_deposits', 'manage_orders'],
            default: [],
        },

        /**
         * Login attempt tracking
         */
        loginAttempts: {
            type: Number,
            default: 0,
        },
        lockedUntil: {
            type: Date,
            default: null,
        },
        lastFailedLogin: {
            type: Date,
            default: null,
        },
        mustChangePassword: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('users', usersSchema);
