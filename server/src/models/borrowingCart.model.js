const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * BORROWING CART MODEL
 * Refactored from cart.model.js
 * Stores temporary book selections before creating a loan transaction
 */
const borrowingCartSchema = new Schema(
    {
        /**
         * User ID (student/faculty)
         */
        userId: {
            type: String,
            required: true,
            index: true,
        },

        /**
         * Full name of the borrower
         */
        fullName: {
            type: String,
            trim: true,
        },

        /**
         * Contact phone number
         */
        phone: {
            type: String,
            trim: true,
        },

        /**
         * Student class or department
         * Refactored from 'address'
         */
        studentClass: {
            type: String,
            trim: true,
        },

        /**
         * Student ID number
         */
        studentId: {
            type: String,
            trim: true,
        },

        /**
         * Books array (refactored from 'product')
         * Contains books to be borrowed
         */
        books: [
            {
                /**
                 * Book ID reference (refactored from productId)
                 */
                bookId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Book',
                    required: true,
                },

                /**
                 * Number of copies to borrow
                 */
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                    default: 1,
                },

                /**
                 * Intended borrow date
                 */
                borrowDate: {
                    type: Date,
                    required: true,
                },

                /**
                 * Intended due date (return date)
                 */
                dueDate: {
                    type: Date,
                    required: true,
                },

                /**
                 * Calculated rental fee for this book
                 */
                rentalFee: {
                    type: Number,
                    min: 0,
                },

                /**
                 * Security deposit for this book
                 */
                depositAmount: {
                    type: Number,
                    min: 0,
                },
            },
        ],

        /**
         * Total rental fee (sum of all books)
         */
        totalRentalFee: {
            type: Number,
            default: 0,
            min: 0,
        },

        /**
         * Total security deposit (sum of all books)
         */
        totalDeposit: {
            type: Number,
            default: 0,
            min: 0,
        },

        /**
         * Applied discount/benefit policy
         */
        appliedBenefitId: {
            type: Schema.Types.ObjectId,
            ref: 'coupon', // Will be refactored to 'benefit' later
        },

        /**
         * Discount amount
         */
        discountAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        /**
         * Cart status
         */
        status: {
            type: String,
            enum: ['active', 'converted', 'expired'],
            default: 'active',
        },
    },
    {
        timestamps: true,
        collection: 'borrowingCarts',
    },
);

// ========================================
// INDEXES
// ========================================

borrowingCartSchema.index({ userId: 1, status: 1 });
borrowingCartSchema.index({ createdAt: -1 });

// ========================================
// VIRTUALS
// ========================================

/**
 * Total amount (rental fee + deposit - discount)
 */
borrowingCartSchema.virtual('totalAmount').get(function () {
    return this.totalRentalFee + this.totalDeposit - this.discountAmount;
});

/**
 * Number of books in cart
 */
borrowingCartSchema.virtual('itemCount').get(function () {
    return this.books.reduce((sum, book) => sum + book.quantity, 0);
});

// ========================================
// METHODS
// ========================================

/**
 * Add book to cart
 */
borrowingCartSchema.methods.addBook = function (bookData) {
    const existingIndex = this.books.findIndex((item) => item.bookId.toString() === bookData.bookId.toString());

    if (existingIndex !== -1) {
        // Update existing book
        this.books[existingIndex].quantity += bookData.quantity || 1;
    } else {
        // Add new book
        this.books.push(bookData);
    }

    return this.save();
};

/**
 * Remove book from cart
 */
borrowingCartSchema.methods.removeBook = function (bookId) {
    this.books = this.books.filter((item) => item.bookId.toString() !== bookId.toString());
    return this.save();
};

/**
 * Clear cart
 */
borrowingCartSchema.methods.clearCart = function () {
    this.books = [];
    this.totalRentalFee = 0;
    this.totalDeposit = 0;
    this.discountAmount = 0;
    return this.save();
};

/**
 * Calculate total fees
 */
borrowingCartSchema.methods.calculateTotals = function () {
    this.totalRentalFee = this.books.reduce((sum, book) => sum + (book.rentalFee || 0), 0);
    this.totalDeposit = this.books.reduce((sum, book) => sum + (book.depositAmount || 0), 0);
    return this;
};

// ========================================
// MIDDLEWARE
// ========================================

/**
 * Pre-save: Calculate totals automatically
 */
borrowingCartSchema.pre('save', function (next) {
    if (this.isModified('books')) {
        this.calculateTotals();
    }
    next();
});

// Enable virtuals in JSON
borrowingCartSchema.set('toJSON', { virtuals: true });
borrowingCartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BorrowingCart', borrowingCartSchema);
