/**
 * SEED DASHBOARD DATA - Generate fake data for demo
 * Run: node seedDashboardData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Models
const User = require('./src/models/users.model');
const Book = require('./src/models/books.model');
const Payment = require('./src/models/payments.model');
const Loan = require('./src/models/loan.model');

// Connect to MongoDB
if (!process.env.MONGO_URI) {
    console.error('âŒ MONGO_URI not found in .env file');
    process.exit(1);
}

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('âœ… Connected to MongoDB'))
    .catch((err) => {
        console.error('âŒ MongoDB connection error:', err);
        process.exit(1);
    });

// Helper functions
const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomPrice = () => randomInt(50000, 500000);

const randomStatus = () => {
    const statuses = ['pending', 'completed', 'delivered', 'cancelled'];
    return statuses[randomInt(0, statuses.length - 1)];
};

// Vietnamese names for realistic data
const firstNames = [
    'Nguyá»…n',
    'Tráº§n',
    'LÃª',
    'Pháº¡m',
    'HoÃ ng',
    'Huá»³nh',
    'Phan',
    'VÅ©',
    'VÃµ',
    'Äáº·ng',
    'BÃ¹i',
    'Äá»—',
    'Há»“',
    'NgÃ´',
    'DÆ°Æ¡ng',
];

const middleNames = ['VÄƒn', 'Thá»‹', 'Äá»©c', 'Minh', 'HoÃ ng', 'Anh', 'Quá»‘c', 'Há»¯u', 'Thanh', 'Thu'];

const lastNames = [
    'An',
    'BÃ¬nh',
    'CÆ°á»ng',
    'DÅ©ng',
    'HÃ ',
    'Háº£i',
    'HÃ¹ng',
    'Khoa',
    'Linh',
    'Long',
    'Mai',
    'Nam',
    'Phong',
    'QuÃ¢n',
    'SÆ¡n',
    'Tháº¯ng',
    'Tuáº¥n',
    'Viá»‡t',
    'Yáº¿n',
];

const generateFullName = () => {
    const first = firstNames[randomInt(0, firstNames.length - 1)];
    const middle = middleNames[randomInt(0, middleNames.length - 1)];
    const last = lastNames[randomInt(0, lastNames.length - 1)];
    return `${first} ${middle} ${last}`;
};

const generateEmail = (fullName) => {
    const name = fullName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '');
    return `${name}${randomInt(1, 999)}@dav.edu.vn`;
};

const generatePhone = () => {
    return `0${randomInt(3, 9)}${randomInt(10000000, 99999999)}`;
};

// Seed functions
async function seedUsers(count = 50) {
    console.log(`\nðŸ“Š Seeding ${count} users...`);

    const users = [];
    const password = bcrypt.hashSync('123456', 10);

    for (let i = 0; i < count; i++) {
        const fullName = generateFullName();
        const email = generateEmail(fullName);

        users.push({
            fullName,
            email,
            password,
            phone: generatePhone(),
            address: `${randomInt(1, 999)} ÄÆ°á»ng ${randomInt(1, 50)}, Quáº­n ${randomInt(1, 12)}, TP. HCM`,
            role: i < 5 ? 'librarian' : 'user', // 5 librarians, rest are users
            permissions: i < 5 ? ['manage_books', 'manage_loans'] : [],
            avatar: 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png',
        });
    }

    try {
        const result = await User.insertMany(users, { ordered: false });
        console.log(`âœ… Created ${result.length} users`);
        return result;
    } catch (error) {
        if (error.code === 11000) {
            console.log(`âš ï¸  Some users already exist (duplicate emails), skipping...`);
            const existingUsers = await User.find();
            return existingUsers;
        }
        throw error;
    }
}

async function seedPayments(users, books, count = 100) {
    console.log(`\nðŸ’° Seeding ${count} payments (borrowing records)...`);

    const payments = [];
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < count; i++) {
        const user = users[randomInt(0, users.length - 1)];
        const numBooks = randomInt(1, 3); // 1-3 books per order
        const selectedBooks = [];

        for (let j = 0; j < numBooks; j++) {
            const book = books[randomInt(0, books.length - 1)];
            const days = randomInt(3, 14); // 3-14 days rental

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
            status: randomStatus(),
            paymentMethod: ['cash', 'bank_transfer', 'momo'][randomInt(0, 2)],
            createdAt,
            updatedAt: createdAt,
        });
    }

    try {
        const result = await Payment.insertMany(payments);
        console.log(`âœ… Created ${result.length} payment records`);
        return result;
    } catch (error) {
        console.error('âŒ Error creating payments:', error.message);
        return [];
    }
}

async function seedLoans(users, books, count = 80) {
    console.log(`\nðŸ“š Seeding ${count} loan records...`);

    const loans = [];
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < count; i++) {
        const user = users[randomInt(0, users.length - 1)];
        const numBooks = randomInt(1, 3); // 1-3 books per loan
        const borrowDate = randomDate(threeMonthsAgo, now);
        const dueDate = new Date(borrowDate.getTime() + randomInt(7, 21) * 24 * 60 * 60 * 1000);
        const isReturned = Math.random() > 0.3; // 70% returned
        const actualReturnDate = isReturned ? randomDate(borrowDate, new Date()) : null;

        const loanBooks = [];
        let totalRentalFee = 0;
        let totalDeposit = 0;
        let totalLateFee = 0;

        // Add books to loan
        for (let j = 0; j < numBooks; j++) {
            const book = books[randomInt(0, books.length - 1)];
            const rentalDays = Math.ceil((dueDate - borrowDate) / (1000 * 60 * 60 * 24));
            const rentalFee = (book.dailyRentalFee || 5000) * rentalDays;
            const depositAmount = book.securityDeposit || 50000;
            const lateFee = !isReturned && Math.random() > 0.5 ? randomInt(10000, 100000) : 0;

            totalRentalFee += rentalFee;
            totalDeposit += depositAmount;
            totalLateFee += lateFee;

            loanBooks.push({
                bookId: book._id,
                quantity: 1,
                borrowDate,
                dueDate,
                actualReturnDate,
                rentalFee,
                depositAmount,
                lateFee,
                damageFee: 0,
                itemStatus: isReturned ? 'returned' : Math.random() > 0.5 ? 'active' : 'overdue',
            });
        }

        const studentClasses = [
            'KhÃ³a 48 - Quan há»‡ quá»‘c táº¿',
            'KhÃ³a 49 - Ngoáº¡i giao',
            'KhÃ³a 47 - Luáº­t quá»‘c táº¿',
            'KhÃ³a 50 - Kinh táº¿ quá»‘c táº¿',
            'KhÃ³a 48 - ChÃ­nh trá»‹ há»c',
        ];

        loans.push({
            userId: user._id.toString(),
            fullName: user.fullName,
            phone: user.phone,
            studentClass: studentClasses[randomInt(0, studentClasses.length - 1)],
            studentId: `HV${randomInt(100000, 999999)}`,
            books: loanBooks,
            totalRentalFee,
            totalDeposit,
            totalLateFee,
            totalDamageFee: 0,
            status: isReturned ? 'returned' : Math.random() > 0.5 ? 'active' : 'overdue',
            feePaymentMethod: ['cash', 'bank_transfer', 'momo'][randomInt(0, 2)],
            feePaymentStatus: isReturned ? 'paid' : 'unpaid',
            discountAmount: 0,
            createdAt: borrowDate,
            updatedAt: actualReturnDate || borrowDate,
        });
    }

    try {
        const result = await Loan.insertMany(loans);
        console.log(`âœ… Created ${result.length} loan records`);
        return result;
    } catch (error) {
        console.error('âŒ Error creating loans:', error.message);
        return [];
    }
}

async function updateBookStats(books, payments) {
    console.log(`\nðŸ“ˆ Updating book statistics...`);

    for (const book of books) {
        let borrowCount = 0;
        let viewCount = randomInt(50, 500);

        // Count how many times this book was borrowed
        for (const payment of payments) {
            const borrowed = payment.product.find((p) => p.productId.toString() === book._id.toString());
            if (borrowed) {
                borrowCount++;
            }
        }

        await Book.findByIdAndUpdate(book._id, {
            borrowCount,
            viewCount,
        });
    }

    console.log(`âœ… Updated statistics for ${books.length} books`);
}

// Main seed function
async function seedAll() {
    try {
        console.log('ðŸŒ± Starting dashboard data seeding...\n');

        // Get existing books
        const books = await Book.find();
        if (books.length === 0) {
            console.error('âŒ No books found! Please run importSampleBooks.js first');
            process.exit(1);
        }
        console.log(`ðŸ“š Found ${books.length} books in database`);

        // Check existing data
        const existingUsers = await User.countDocuments();
        const existingPayments = await Payment.countDocuments();
        const existingLoans = await Loan.countDocuments();

        console.log(`\nðŸ“Š Current data:`);
        console.log(`   Users: ${existingUsers}`);
        console.log(`   Payments: ${existingPayments}`);
        console.log(`   Loans: ${existingLoans}`);

        // Seed users
        const users = await seedUsers(50);

        // Seed payments (borrowing transactions)
        const payments = await seedPayments(users, books, 100);

        // Seed loan records
        await seedLoans(users, books, 80);

        // Update book statistics
        await updateBookStats(books, payments);

        // Summary
        console.log(`\nâœ… SEEDING COMPLETED!`);
        console.log(`\nðŸ“Š Final statistics:`);
        console.log(`   Users: ${await User.countDocuments()}`);
        console.log(`   Books: ${await Book.countDocuments()}`);
        console.log(`   Payments: ${await Payment.countDocuments()}`);
        console.log(`   Loans: ${await Loan.countDocuments()}`);

        console.log(`\nðŸ’¡ Default user credentials:`);
        console.log(`   Email: Any generated email (check database)`);
        console.log(`   Password: 123456`);

        process.exit(0);
    } catch (error) {
        console.error('âŒ Seeding failed:', error);
        process.exit(1);
    }
}

// Clear existing data function
async function clearData() {
    console.log('ðŸ—‘ï¸  Clearing existing demo data...\n');

    try {
        // Don't delete admin users
        await User.deleteMany({ role: { $ne: 'admin' } });
        await Payment.deleteMany({});
        await Loan.deleteMany({});

        // Reset book stats
        await Book.updateMany({}, { borrowCount: 0, viewCount: 0 });

        console.log('âœ… Cleared all demo data (kept admin users)\n');
    } catch (error) {
        console.error('âŒ Error clearing data:', error);
    }
}

// Run based on command line argument
const command = process.argv[2];

if (command === 'clear') {
    clearData().then(() => {
        console.log('âœ… Data cleared successfully');
        process.exit(0);
    });
} else if (command === 'reset') {
    clearData().then(() => seedAll());
} else {
    seedAll();
}

