const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * LOAN MODEL (Borrowing Transaction)
 * Refactored from payments.model.js
 * Represents a book borrowing transaction with status tracking
 */
const loanSchema = new Schema(
    {
        /**
         * User ID (student/faculty borrower)
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
            required: true,
            trim: true,
        },

        /**
         * Contact phone number
         */
        phone: {
            type: String,
            required: true,
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
         * Reference to borrowing cart (optional)
         */
        borrowingCartId: {
            type: Schema.Types.ObjectId,
            ref: 'BorrowingCart',
        },

        /**
         * Books array (borrowed items)
         * Refactored from 'product'
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
                 * Number of copies borrowed
                 */
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                    default: 1,
                },

                /**
                 * Borrow date (refactored from startDate)
                 */
                borrowDate: {
                    type: Date,
                    required: true,
                    default: Date.now,
                },

                /**
                 * Due date for return (refactored from endDate)
                 */
                dueDate: {
                    type: Date,
                    required: true,
                },

                /**
                 * Actual return date (null if not returned yet)
                 */
                actualReturnDate: {
                    type: Date,
                    default: null,
                },

                /**
                 * Rental fee for this book
                 */
                rentalFee: {
                    type: Number,
                    required: true,
                    min: 0,
                },

                /**
                 * Security deposit for this book
                 */
                depositAmount: {
                    type: Number,
                    required: true,
                    default: 0,
                    min: 0,
                },

                /**
                 * Late fee (if overdue)
                 */
                lateFee: {
                    type: Number,
                    default: 0,
                    min: 0,
                },

                /**
                 * Damage fee (if book damaged)
                 */
                damageFee: {
                    type: Number,
                    default: 0,
                    min: 0,
                },

                /**
                 * Item status
                 */
                itemStatus: {
                    type: String,
                    enum: ['active', 'returned', 'overdue', 'lost'],
                    default: 'active',
                },

                /**
                 * Notes for this specific book
                 */
                notes: {
                    type: String,
                    trim: true,
                },
            },
        ],

        /**
         * Total rental fee
         */
        totalRentalFee: {
            type: Number,
            required: true,
            min: 0,
        },

        /**
         * Total security deposit
         */
        totalDeposit: {
            type: Number,
            required: true,
            min: 0,
        },

        /**
         * Total late fees
         */
        totalLateFee: {
            type: Number,
            default: 0,
            min: 0,
        },

        /**
         * Total damage fees
         */
        totalDamageFee: {
            type: Number,
            default: 0,
            min: 0,
        },

        /**
         * Transaction status
         * Refactored from ['pending', 'completed', 'cancelled', 'delivered']
         * to ['requested', 'active', 'returned', 'overdue']
         */
        status: {
            type: String,
            enum: ['requested', 'approved', 'active', 'returned', 'overdue', 'cancelled'],
            default: 'requested',
            index: true,
        },

        /**
         * Fee payment method
         * Refactored from 'paymentMethod'
         */
        feePaymentMethod: {
            type: String,
            enum: ['cash', 'cod', 'bank_transfer', 'momo', 'vnpay', 'card'],
            default: 'cash',
        },

        /**
         * Fee payment status
         */
        feePaymentStatus: {
            type: String,
            enum: ['unpaid', 'partial', 'paid', 'refunded'],
            default: 'unpaid',
        },

        /**
         * Applied benefit/discount policy
         * Refactored from 'couponId'
         */
        appliedBenefitId: {
            type: Schema.Types.ObjectId,
            ref: 'coupon', // Will be refactored to 'benefit' later
        },

        /**
         * Discount amount
         * Refactored from 'discountAmount'
         */
        discountAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        /**
         * Deposit return status
         */
        depositReturnStatus: {
            type: String,
            enum: ['held', 'partial', 'returned'],
            default: 'held',
        },

        /**
         * Deposit returned amount
         */
        depositReturnedAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        /**
         * Staff who processed the loan
         */
        processedBy: {
            type: Schema.Types.ObjectId,
            ref: 'users',
        },

        /**
         * Staff who processed the return
         */
        returnProcessedBy: {
            type: Schema.Types.ObjectId,
            ref: 'users',
        },

        /**
         * Transaction notes/remarks
         */
        notes: {
            type: String,
            trim: true,
        },

        /**
         * Reminder sent count (for overdue notifications)
         */
        remindersSent: {
            type: Number,
            default: 0,
            min: 0,
        },

        /**
         * Last reminder sent date
         */
        lastReminderDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
        collection: 'loans',
    },
);

// ========================================
// INDEXES
// ========================================

loanSchema.index({ userId: 1, status: 1 });
loanSchema.index({ status: 1, 'books.dueDate': 1 }); // For overdue queries
loanSchema.index({ studentId: 1 });
loanSchema.index({ createdAt: -1 });
loanSchema.index({ 'books.bookId': 1 }); // For book availability checks

// ========================================
// VIRTUALS
// ========================================

/**
 * Total amount to be paid
 */
loanSchema.virtual('totalAmount').get(function () {
    return this.totalRentalFee + this.totalLateFee + this.totalDamageFee - this.discountAmount;
});

/**
 * Total copies borrowed
 */
loanSchema.virtual('totalCopies').get(function () {
    return this.books.reduce((sum, book) => sum + book.quantity, 0);
});

/**
 * Is overdue
 */
loanSchema.virtual('isOverdue').get(function () {
    if (this.status === 'returned') return false;
    const now = new Date();
    return this.books.some((book) => new Date(book.dueDate) < now && book.itemStatus === 'active');
});

/**
 * Days overdue (max across all books)
 */
loanSchema.virtual('daysOverdue').get(function () {
    if (this.status === 'returned') return 0;
    const now = new Date();
    const overdueDays = this.books.map((book) => {
        if (book.itemStatus !== 'active') return 0;
        const due = new Date(book.dueDate);
        return due < now ? Math.ceil((now - due) / (1000 * 60 * 60 * 24)) : 0;
    });
    return Math.max(...overdueDays, 0);
});

// ========================================
// METHODS
// ========================================

/**
 * Check and update overdue status
 */
loanSchema.methods.updateOverdueStatus = async function () {
    const now = new Date();
    let hasOverdue = false;

    this.books.forEach((book) => {
        if (book.itemStatus === 'active' && new Date(book.dueDate) < now) {
            book.itemStatus = 'overdue';
            hasOverdue = true;
        }
    });

    if (hasOverdue && this.status === 'active') {
        this.status = 'overdue';
    }

    return await this.save();
};

/**
 * Calculate late fees
 */
loanSchema.methods.calculateLateFees = function (lateFeePerDay = 5000) {
    const now = new Date();
    let totalLateFee = 0;

    this.books.forEach((book) => {
        if (book.itemStatus === 'overdue' || (book.itemStatus === 'active' && new Date(book.dueDate) < now)) {
            const dueDate = new Date(book.dueDate);
            const daysLate = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
            if (daysLate > 0) {
                book.lateFee = daysLate * lateFeePerDay * book.quantity;
                totalLateFee += book.lateFee;
            }
        }
    });

    this.totalLateFee = totalLateFee;
    return this;
};

/**
 * Process return for a specific book
 */
loanSchema.methods.returnBook = async function (bookId, returnData = {}) {
    const book = this.books.find((b) => b.bookId.toString() === bookId.toString());
    if (!book) {
        throw new Error('Book not found in this loan');
    }

    book.actualReturnDate = returnData.returnDate || new Date();
    book.itemStatus = 'returned';
    book.damageFee = returnData.damageFee || 0;
    book.notes = returnData.notes || book.notes;

    this.totalDamageFee += book.damageFee;

    // Check if all books are returned
    const allReturned = this.books.every((b) => b.itemStatus === 'returned');
    if (allReturned) {
        this.status = 'returned';
    }

    return await this.save();
};

/**
 * Send reminder
 */
loanSchema.methods.sendReminder = async function () {
    this.remindersSent += 1;
    this.lastReminderDate = new Date();
    return await this.save();
};

// ========================================
// STATIC METHODS
// ========================================

/**
 * Find active loans
 */
loanSchema.statics.findActive = function (userId = null) {
    const query = { status: { $in: ['approved', 'active', 'overdue'] } };
    if (userId) query.userId = userId;
    return this.find(query);
};

/**
 * Find overdue loans
 */
loanSchema.statics.findOverdue = function () {
    const now = new Date();
    return this.find({
        status: { $in: ['active', 'overdue'] },
        'books.dueDate': { $lt: now },
        'books.itemStatus': 'active',
    });
};

/**
 * Find loans by student
 */
loanSchema.statics.findByStudent = function (studentId) {
    return this.find({ studentId }).sort({ createdAt: -1 });
};

// ========================================
// MIDDLEWARE
// ========================================

/**
 * Pre-save: Auto-update overdue status
 */
loanSchema.pre('save', function (next) {
    if (this.isModified('books') || this.isModified('status')) {
        const now = new Date();
        const hasOverdue = this.books.some((book) => book.itemStatus === 'active' && new Date(book.dueDate) < now);

        if (hasOverdue && this.status === 'active') {
            this.status = 'overdue';
        }
    }
    next();
});

// Enable virtuals in JSON
loanSchema.set('toJSON', { virtuals: true });
loanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Loan', loanSchema);
