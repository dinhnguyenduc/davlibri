const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const connectDB = require('./config/connectDB');
const routes = require('./routes/index.routes');

const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import middleware & utilities
const { errorHandler, asyncHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const CacheManager = require('./utils/CacheManager');
const { RateLimiter, PRESETS } = require('./middleware/rateLimiter');

// Initialize cache manager
const cache = new CacheManager({
    maxSize: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    strategy: 'LRU',
});

// Initialize rate limiter
const globalLimiter = new RateLimiter(PRESETS.public);
const authLimiter = new RateLimiter(PRESETS.auth);
const searchLimiter = new RateLimiter(PRESETS.search);
const isRateLimitingDisabled = process.env.DISABLE_RATE_LIMITING === 'true';

logger.info('Server starting', {
    environment: process.env.NODE_ENV || 'development',
    port,
});

app.use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Always allow local dev origins alongside whatever CLIENT_URL is configured for deployment
const allowedOrigins = new Set(
    ['http://localhost:5173', 'http://127.0.0.1:5173', process.env.CLIENT_URL, process.env.DOMAIN_URL].filter(Boolean),
);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.has(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
    }),
);

// Apply rate limiting to public endpoints unless temporarily disabled
if (!isRateLimitingDisabled) {
    app.use(globalLimiter.middleware());
}

// Cache middleware for GET requests (optional)
// app.use(cache.middleware({ keyPrefix: 'api', ttl: 5 * 60 * 1000 }));

routes(app);

// Error handling middleware (must be last)
app.use(errorHandler);

const startServer = async () => {
    try {
        await connectDB();

        app.listen(port, () => {
            logger.info(`Server listening on port ${port}`);
        });
    } catch (error) {
        logger.error('Failed to start server due to MongoDB connection error', {
            message: error.message,
        });
        process.exit(1);
    }
};

startServer();
