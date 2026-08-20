const mongoose = require('mongoose');

const policySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        icon: {
            type: String,
            required: true, // URL của icon/hình ảnh
        },
        link: {
            type: String,
            default: '#',
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        iconColor: {
            type: String,
            default: '#ff6b6b', // Màu nền icon
        },
    },
    {
        timestamps: true,
        collection: 'Policies',
    },
);

module.exports = mongoose.model('Policy', policySchema);
