const mongoose = require('mongoose');

const animatedHeadlineSchema = new mongoose.Schema(
    {
        plainText: {
            type: String,
            required: true,
            trim: true,
        },
        dynamicText: {
            type: String,
            required: true,
            trim: true,
        },
        textColor: {
            type: String,
            default: '#333333',
        },
        highlightColor: {
            type: String,
            default: '#ff6b6b',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        collection: 'AnimatedHeadlines',
    },
);

module.exports = mongoose.model('AnimatedHeadline', animatedHeadlineSchema);
