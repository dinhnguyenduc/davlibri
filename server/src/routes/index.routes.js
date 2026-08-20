const usersRoutes = require('./users.routes');
const categoryRoutes = require('./category.routes');

// Library Management Routes
const booksRoutes = require('./books.routes');
const borrowingCartRoutes = require('./borrowingCart.routes');
const loanRoutes = require('./loan.routes');

// Admin Tools
const seedRoutes = require('./seed.route');
const loginAttemptConfigRoutes = require('./loginAttemptConfig.routes');
const emailConfigRoutes = require('./emailConfig.routes');

// Legacy routes (renamed but kept for backward compatibility)
const cartRoutes = require('./cart.routes');
const paymentsRoutes = require('./payments.routes');
const viewBookRoutes = require('./viewBook.routes');
const couponRoutes = require('./coupon.routes');
const chatbotRoutes = require('./chatbot.routes');
const chatbotConfigRoutes = require('./chatbotConfig.routes');
const liveChatRoutes = require('./liveChat.routes');
const bannerRoutes = require('./banner.routes');
const headlineRoutes = require('./animatedHeadline.routes');
const policyRoutes = require('./policy.routes');

function routes(app) {
    app.use('/api/users', usersRoutes);
    app.use('/api/category', categoryRoutes);

    // Library Management Routes (Active)
    app.use('/api/books', booksRoutes);
    app.use('/api/borrowing-cart', borrowingCartRoutes);
    app.use('/api/loans', loanRoutes);

    // Admin Tools
    app.use('/api/seed', seedRoutes);
    app.use('/api/login-attempt-config', loginAttemptConfigRoutes);
    app.use('/api/email-config', emailConfigRoutes);

    // Legacy routes (renamed but kept for backward compatibility)
    app.use('/api/cart', cartRoutes);
    app.use('/api/payments', paymentsRoutes);
    app.use('/api/view-book', viewBookRoutes);
    app.use('/api/coupon', couponRoutes);
    app.use('/api/chatbot', chatbotRoutes);
    app.use('/api/chatbot/config', chatbotConfigRoutes);
    app.use('/api/live-chat', liveChatRoutes);
    app.use('/api/banner', bannerRoutes);
    app.use('/api/headline', headlineRoutes);
    app.use('/api/policy', policyRoutes);
}

module.exports = routes;
