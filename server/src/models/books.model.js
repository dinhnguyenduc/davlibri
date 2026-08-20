const mongoose = require('mongoose');

const { Schema } = mongoose;

const bookSchema = new Schema(
    {
        // ========================================
        // CORE BOOK INFORMATION
        // ========================================

        /**
         * Book title (refactored from nameProduct)
         */
        title: {
            type: String,
            required: true,
            index: true,
            trim: true,
        },

        /**
         * Author name(s)
         */
        author: {
            type: String,
            required: true,
            index: true,
            trim: true,
        },

        /**
         * ISBN - International Standard Book Number
         */
        isbn: {
            type: String,
            unique: true,
            sparse: true, // Allow multiple books without ISBN
            trim: true,
            uppercase: true,
        },

        /**
         * Book description/summary
         */
        description: {
            type: String,
            required: true,
        },

        /**
         * Category/Genre of the book
         */
        category: {
            type: String,
            required: true,
            ref: 'category',
            index: true,
        },

        /**
         * Keywords for search optimization
         */
        keywords: [
            {
                type: String,
                trim: true,
            },
        ],

        // ========================================
        // PUBLISHING INFORMATION
        // ========================================

        /**
         * Publisher name
         */
        publisher: {
            type: String,
            required: true,
            trim: true,
        },

        /**
         * Publishing house
         */
        publishingHouse: {
            type: String,
            required: true,
            trim: true,
        },

        /**
         * Publication year
         */
        publicationYear: {
            type: Number,
            min: 1000,
            max: new Date().getFullYear() + 1,
        },

        /**
         * Cover type
         */
        coverType: {
            type: String,
            required: true,
            enum: ['paperback', 'hardcover'],
            default: 'paperback',
        },

        // ========================================
        // LIBRARY MANAGEMENT
        // ========================================

        /**
         * Available copies for borrowing (refactored from stock)
         */
        availableCopies: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
            validate: {
                validator: function (value) {
                    // Only validate if totalCopies is set
                    if (this.totalCopies !== undefined && this.totalCopies !== null) {
                        return value <= this.totalCopies;
                    }
                    return true;
                },
                message: 'Available copies cannot be greater than total copies',
            },
        },

        /**
         * Total copies in library inventory (refactored from quantity alias)
         */
        totalCopies: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
            validate: {
                validator: function (value) {
                    // Only validate if availableCopies is set
                    if (this.availableCopies !== undefined && this.availableCopies !== null) {
                        return value >= this.availableCopies;
                    }
                    return true;
                },
                message: 'Total copies must be greater than or equal to available copies',
            },
        },

        /**
         * Daily rental fee (refactored from price)
         */
        dailyRentalFee: {
            type: Number,
            required: true,
            min: 0,
        },

        /**
         * Security deposit amount
         */
        securityDeposit: {
            type: Number,
            default: 50000,
            min: 0,
        },

        /**
         * Shelf location in library
         */
        location: {
            type: String,
            trim: true,
        },

        // ========================================
        // STATISTICS & TRACKING
        // ========================================

        /**
         * Number of times this book has been viewed
         */
        viewCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        /**
         * Number of times this book has been borrowed (refactored from rentCount)
         */
        borrowCount: {
            type: Number,
            default: 0,
            min: 0,
        },

        /**
         * Display order for featured books (lower = higher priority)
         */
        displayOrder: {
            type: Number,
            default: 999999,
            min: 0,
        },

        // ========================================
        // MEDIA & ASSETS
        // ========================================

        /**
         * Book cover images
         */
        images: {
            type: [String],
            required: true,
            validate: {
                validator: function (value) {
                    return value && value.length > 0;
                },
                message: 'At least one image is required',
            },
        },

        // ========================================
        // VECTOR SEARCH FIELDS (CHƯƠNG 3.3.2)
        // ========================================

        /**
         * Vector embedding for semantic search
         * - Model: Google Gemini text-embedding-004
         * - Dimensions: 768 (fixed)
         * - Generated from: title + author + description
         */
        embedding: {
            type: [Number],
            required: false,
            select: false, // Don't return by default (save bandwidth)
            validate: {
                validator: function (v) {
                    return !v || v.length === 768;
                },
                message: 'Embedding must be exactly 768 dimensions',
            },
        },

        /**
         * Embedding metadata for tracking
         */
        embeddingMetadata: {
            model: {
                type: String,
                default: 'text-embedding-004',
            },
            generatedAt: Date,
            textUsed: String, // First 500 chars of source text
        },
    },
    {
        timestamps: true,
        collection: 'books', // Explicit collection name
    },
);

// ========================================
// INDEXES
// ========================================

// Text search index for semantic search (important for RAG!)
bookSchema.index(
    {
        title: 'text',
        author: 'text',
        description: 'text',
        keywords: 'text',
        publisher: 'text',
    },
    {
        weights: {
            title: 10, // Title is most important
            author: 8, // Author second most important
            keywords: 6, // Keywords
            description: 3, // Description
            publisher: 2, // Publisher
        },
        name: 'BookSearchIndex',
    },
);

// Compound indexes for common queries
bookSchema.index({ availableCopies: 1, viewCount: -1 }); // Available books sorted by popularity
bookSchema.index({ category: 1, borrowCount: -1 }); // Books by category sorted by borrow count
bookSchema.index({ displayOrder: 1, createdAt: -1 }); // Featured books
bookSchema.index({ location: 1 }); // Location-based search

// ========================================
// VIRTUALS
// ========================================

/**
 * Virtual field: borrowed copies
 */
bookSchema.virtual('borrowedCopies').get(function () {
    return this.totalCopies - this.availableCopies;
});

/**
 * Virtual field: availability status
 */
bookSchema.virtual('isAvailable').get(function () {
    return this.availableCopies > 0;
});

/**
 * Virtual field: availability percentage
 */
bookSchema.virtual('availabilityRate').get(function () {
    if (this.totalCopies === 0) return 0;
    return ((this.availableCopies / this.totalCopies) * 100).toFixed(2);
});

// ========================================
// METHODS
// ========================================

/**
 * Borrow a book (decrease available copies)
 */
bookSchema.methods.borrowBook = async function (quantity = 1) {
    if (this.availableCopies < quantity) {
        throw new Error('Not enough available copies');
    }
    this.availableCopies -= quantity;
    this.borrowCount += quantity;
    return await this.save();
};

/**
 * Return a book (increase available copies)
 */
bookSchema.methods.returnBook = async function (quantity = 1) {
    if (this.availableCopies + quantity > this.totalCopies) {
        throw new Error('Cannot return more copies than total inventory');
    }
    this.availableCopies += quantity;
    return await this.save();
};

/**
 * Increment view count
 */
bookSchema.methods.incrementView = async function () {
    this.viewCount += 1;
    return await this.save();
};

// ========================================
// STATIC METHODS
// ========================================

/**
 * Find available books
 */
bookSchema.statics.findAvailable = function (filters = {}) {
    return this.find({
        ...filters,
        availableCopies: { $gt: 0 },
    });
};

/**
 * Find popular books
 */
bookSchema.statics.findPopular = function (limit = 10) {
    return this.find({ availableCopies: { $gt: 0 } })
        .sort({ borrowCount: -1, viewCount: -1 })
        .limit(limit);
};

/**
 * Find featured books
 */
bookSchema.statics.findFeatured = function (limit = 10) {
    return this.find({ availableCopies: { $gt: 0 } })
        .sort({ displayOrder: 1, createdAt: -1 })
        .limit(limit);
};

// ========================================
// MIDDLEWARE
// ========================================

/**
 * Pre-save: Validate totalCopies >= availableCopies
 */
bookSchema.pre('save', function (next) {
    if (this.totalCopies < this.availableCopies) {
        next(new Error('Total copies cannot be less than available copies'));
    } else {
        next();
    }
});

/**
 * Pre-save: Auto-generate ISBN if not provided (optional)
 */
bookSchema.pre('save', function (next) {
    if (!this.isbn && this.isNew) {
        // Generate a temporary internal ID (not real ISBN)
        this.isbn = `INTERNAL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }
    next();
});

// Enable virtuals in JSON
bookSchema.set('toJSON', { virtuals: true });
bookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Book', bookSchema);
