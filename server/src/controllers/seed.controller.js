const bcrypt = require('bcrypt');
const User = require('../models/users.model');
const Book = require('../models/books.model');
const Payment = require('../models/payments.model');
const Loan = require('../models/loan.model');

const { OK } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

// Helper functions
const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const firstNames = ['Nguyá»…n', 'Tráº§n', 'LÃª', 'Pháº¡m', 'HoÃ ng', 'Huá»³nh', 'Phan', 'VÅ©', 'VÃµ', 'Äáº·ng', 'BÃ¹i', 'Äá»—'];
const middleNames = ['VÄƒn', 'Thá»‹', 'Äá»©c', 'Minh', 'HoÃ ng', 'Anh', 'Quá»‘c', 'Há»¯u', 'Thanh', 'Thu'];
const lastNames = ['An', 'BÃ¬nh', 'CÆ°á»ng', 'DÅ©ng', 'HÃ ', 'Háº£i', 'HÃ¹ng', 'Khoa', 'Linh', 'Long', 'Mai', 'Nam'];

const generateFullName = () => {
    return `${firstNames[randomInt(0, firstNames.length - 1)]} ${
        middleNames[randomInt(0, middleNames.length - 1)]
    } ${lastNames[randomInt(0, lastNames.length - 1)]}`;
};

const generateEmail = (fullName) => {
    const name = fullName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '');
    return `${name}${randomInt(100, 999)}@dav.edu.vn`;
};

const generatePhone = () => `0${randomInt(3, 9)}${randomInt(10000000, 99999999)}`;

class SeedController {
    /**
     * Generate fake users
     */
    async seedUsers(req, res) {
        const { count = 30 } = req.body;

        const users = [];
        const password = bcrypt.hashSync('123456', 10);

        for (let i = 0; i < count; i++) {
            const fullName = generateFullName();
            users.push({
                fullName,
                email: generateEmail(fullName),
                password,
                phone: generatePhone(),
                address: `${randomInt(1, 999)} ÄÆ°á»ng ${randomInt(1, 50)}, Quáº­n ${randomInt(1, 12)}, TP. HCM`,
                role: i < Math.floor(count / 10) ? 'librarian' : 'user',
                permissions: i < Math.floor(count / 10) ? ['manage_books', 'manage_loans'] : [],
                avatar: 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png',
            });
        }

        try {
            const result = await User.insertMany(users, { ordered: false });
            return new OK({
                message: `ÄÃ£ táº¡o ${result.length} ngÆ°á»i dÃ¹ng giáº£ láº­p`,
                metadata: { created: result.length },
            }).send(res);
        } catch (error) {
            if (error.code === 11000) {
                return new OK({
                    message: 'Má»™t sá»‘ email Ä‘Ã£ tá»“n táº¡i, Ä‘Ã£ bá» qua',
                    metadata: { created: 0 },
                }).send(res);
            }
            throw error;
        }
    }

    /**
     * Generate fake payments/borrowing records
     */
    async seedPayments(req, res) {
        const { count = 50 } = req.body;

        const users = await User.find().limit(100);
        const books = await Book.find().limit(50);

        if (users.length === 0 || books.length === 0) {
            throw new BadRequestError('Cáº§n cÃ³ ngÆ°á»i dÃ¹ng vÃ  sÃ¡ch trÆ°á»›c khi táº¡o Ä‘Æ¡n hÃ ng');
        }

        const payments = [];
        const now = new Date();
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        for (let i = 0; i < count; i++) {
            const user = users[randomInt(0, users.length - 1)];
            const numBooks = randomInt(1, 3);
            const selectedBooks = [];

            for (let j = 0; j < numBooks; j++) {
                const book = books[randomInt(0, books.length - 1)];
                const days = randomInt(3, 14);
                selectedBooks.push({
                    productId: book._id,
                    quantity: 1,
                    price: book.dailyRentalFee * days,
                    days,
                });
            }

            const totalPrice = selectedBooks.reduce((sum, item) => sum + item.price, 0);
            const createdAt = randomDate(threeMonthsAgo, now);

            payments.push({
                userId: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                address: user.address,
                product: selectedBooks,
                totalPrice,
                status: ['pending', 'completed', 'delivered', 'cancelled'][randomInt(0, 3)],
                paymentMethod: ['cash', 'bank_transfer', 'momo'][randomInt(0, 2)],
                createdAt,
                updatedAt: createdAt,
            });
        }

        const result = await Payment.insertMany(payments);

        return new OK({
            message: `ÄÃ£ táº¡o ${result.length} Ä‘Æ¡n hÃ ng giáº£ láº­p`,
            metadata: { created: result.length },
        }).send(res);
    }

    /**
     * Generate fake loan records
     */
    async seedLoans(req, res) {
        const { count = 40 } = req.body;

        const users = await User.find().limit(100);
        const books = await Book.find().limit(50);

        if (users.length === 0 || books.length === 0) {
            throw new BadRequestError('Cáº§n cÃ³ ngÆ°á»i dÃ¹ng vÃ  sÃ¡ch trÆ°á»›c khi táº¡o phiáº¿u mÆ°á»£n');
        }

        const loans = [];
        const now = new Date();
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        for (let i = 0; i < count; i++) {
            const user = users[randomInt(0, users.length - 1)];
            const book = books[randomInt(0, books.length - 1)];
            const borrowDate = randomDate(threeMonthsAgo, now);
            const dueDate = new Date(borrowDate.getTime() + randomInt(7, 21) * 24 * 60 * 60 * 1000);
            const isReturned = Math.random() > 0.3;
            const returnDate = isReturned ? randomDate(borrowDate, new Date()) : null;

            loans.push({
                userId: user._id,
                bookId: book._id,
                borrowDate,
                dueDate,
                returnDate,
                status: isReturned ? 'returned' : Math.random() > 0.5 ? 'borrowed' : 'overdue',
                dailyRentalFee: book.dailyRentalFee,
                securityDeposit: book.securityDeposit || 50000,
                totalFee: book.dailyRentalFee * randomInt(7, 21),
                lateFee: isReturned ? 0 : randomInt(0, 100000),
                feePaymentStatus: isReturned ? 'paid' : 'pending',
            });
        }

        const result = await Loan.insertMany(loans);

        return new OK({
            message: `ÄÃ£ táº¡o ${result.length} phiáº¿u mÆ°á»£n giáº£ láº­p`,
            metadata: { created: result.length },
        }).send(res);
    }

    /**
     * Update book statistics
     */
    async updateBookStats(req, res) {
        const books = await Book.find();
        const payments = await Payment.find();

        for (const book of books) {
            let borrowCount = 0;
            const viewCount = randomInt(50, 500);

            for (const payment of payments) {
                const borrowed = payment.product.find((p) => p.productId.toString() === book._id.toString());
                if (borrowed) borrowCount++;
            }

            await Book.findByIdAndUpdate(book._id, { borrowCount, viewCount });
        }

        return new OK({
            message: `ÄÃ£ cáº­p nháº­t thá»‘ng kÃª cho ${books.length} sÃ¡ch`,
            metadata: { updated: books.length },
        }).send(res);
    }

    /**
     * Clear demo data
     */
    async clearDemoData(req, res) {
        // Don't delete admin users
        const deletedUsers = await User.deleteMany({ role: { $ne: 'admin' } });
        const deletedPayments = await Payment.deleteMany({});
        const deletedLoans = await Loan.deleteMany({});

        // Reset book stats
        await Book.updateMany({}, { borrowCount: 0, viewCount: 0 });

        return new OK({
            message: 'ÄÃ£ xÃ³a dá»¯ liá»‡u demo (giá»¯ láº¡i admin)',
            metadata: {
                deletedUsers: deletedUsers.deletedCount,
                deletedPayments: deletedPayments.deletedCount,
                deletedLoans: deletedLoans.deletedCount,
            },
        }).send(res);
    }

    /**
     * Seed all data at once
     */
    async seedAll(req, res) {
        const { users = 30, payments = 50, loans = 40 } = req.body;

        // Seed users
        await this.seedUsers({ body: { count: users } }, res);

        // Wait a bit for users to be indexed
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Seed payments
        await this.seedPayments({ body: { count: payments } }, res);

        // Seed loans
        await this.seedLoans({ body: { count: loans } }, res);

        // Update stats
        await this.updateBookStats(req, res);

        const finalStats = {
            users: await User.countDocuments(),
            books: await Book.countDocuments(),
            payments: await Payment.countDocuments(),
            loans: await Loan.countDocuments(),
        };

        return new OK({
            message: 'ÄÃ£ táº¡o táº¥t cáº£ dá»¯ liá»‡u demo thÃ nh cÃ´ng',
            metadata: finalStats,
        }).send(res);
    }

    /**
     * Get current statistics
     */
    async getStats(req, res) {
        const stats = {
            users: await User.countDocuments(),
            books: await Book.countDocuments(),
            payments: await Payment.countDocuments(),
            loans: await Loan.countDocuments(),
        };

        return new OK({
            message: 'Thá»‘ng kÃª dá»¯ liá»‡u hiá»‡n táº¡i',
            metadata: stats,
        }).send(res);
    }
}

module.exports = new SeedController();

