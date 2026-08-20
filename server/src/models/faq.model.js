const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            trim: true,
        },
        answer: {
            type: String,
            required: true,
        },
        keywords: {
            type: [String],
            default: [],
        },
        category: {
            type: String,
            enum: [
                'general',
                'product',
                'payment',
                'rental',
                'return',
                'other',
                // 🆕 DAV-specific categories from Golden Dataset
                'Quy chế Học viện',
                'Chính trị - Đối ngoại',
                'Luật pháp Quốc tế',
                'Quan hệ Quốc tế',
                'Lịch sử & Truyền thống DAV',
                'Quy chế đặc thù',
                'Chính trì - Đối ngoại', // Typo in original data
            ],
            default: 'general',
        },
        // 🆕 Enhanced metadata from Golden Dataset
        topic: {
            type: String,
            trim: true,
            default: '',
        },
        complexity: {
            type: String,
            enum: ['easy', 'medium', 'hard', ''],
            default: '',
        },
        source_ref: {
            type: String,
            trim: true,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        viewCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    },
);

// Index để tìm kiếm nhanh
faqSchema.index({ question: 'text', keywords: 'text', answer: 'text' });

module.exports = mongoose.model('FAQ', faqSchema);
