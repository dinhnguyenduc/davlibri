const mongoose = require('mongoose');

// Schema cho từ điển ngữ cảnh (Context Dictionary)
const contextDictionarySchema = new mongoose.Schema(
    {
        term: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        definition: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ['politics', 'economics', 'diplomacy', 'general', 'academic', 'other'],
            default: 'general',
        },
        aliases: {
            type: [String],
            default: [],
        },
        relatedTerms: {
            type: [String],
            default: [],
        },
        bookReferences: [
            {
                bookId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Products',
                },
                bookTitle: String,
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        collection: 'contextDictionary',
    },
);

// Text search index
contextDictionarySchema.index({ term: 'text', definition: 'text', aliases: 'text' });

const modelContextDictionary = mongoose.model('ContextDictionary', contextDictionarySchema);

module.exports = modelContextDictionary;
