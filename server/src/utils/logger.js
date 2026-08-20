/**
 * Winston Logger Configuration
 * Handles structured logging with file rotation
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if not exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define custom log format
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message} ${metaStr}`;
    }),
);

// Define transports
const transports = [
    // Console transport (always enabled)
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp }) => {
                return `${timestamp} [${level}] ${message}`;
            }),
        ),
    }),

    // File transport for all logs
    new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: customFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 10,
        tailable: true,
    }),

    // File transport for errors only
    new winston.transports.File({
        filename: path.join(logsDir, 'errors.log'),
        level: 'error',
        format: customFormat,
        maxsize: 5242880,
        maxFiles: 10,
        tailable: true,
    }),

    // File transport for warnings
    new winston.transports.File({
        filename: path.join(logsDir, 'warnings.log'),
        level: 'warn',
        format: customFormat,
        maxsize: 5242880,
        maxFiles: 5,
        tailable: true,
    }),
];

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    transports,
    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            format: customFormat,
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            format: customFormat,
        }),
    ],
});

// Log application start
logger.info('Logger initialized', {
    environment: process.env.NODE_ENV || 'development',
    logsDir,
});

/**
 * Logger methods with metadata support
 */
const log = {
    error: (message, meta = {}) => {
        logger.error(message, meta);
    },

    warn: (message, meta = {}) => {
        logger.warn(message, meta);
    },

    info: (message, meta = {}) => {
        logger.info(message, meta);
    },

    debug: (message, meta = {}) => {
        logger.debug(message, meta);
    },

    // Performance logging
    performance: (operation, duration, meta = {}) => {
        const level = duration > 1000 ? 'warn' : 'info';
        logger[level](`Performance: ${operation}`, {
            duration: `${duration}ms`,
            ...meta,
        });
    },

    // API request/response logging
    api: (method, path, statusCode, duration, meta = {}) => {
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        logger[level](`API ${method} ${path} -> ${statusCode}`, {
            statusCode,
            duration: `${duration}ms`,
            ...meta,
        });
    },

    // Database operations logging
    database: (operation, collection, duration, meta = {}) => {
        const level = duration > 500 ? 'warn' : 'debug';
        logger[level](`Database: ${operation} on ${collection}`, {
            duration: `${duration}ms`,
            ...meta,
        });
    },

    // AI/Chatbot logging
    chatbot: (action, meta = {}) => {
        logger.info(`Chatbot: ${action}`, meta);
    },

    // Payment logging
    payment: (action, statusCode, meta = {}) => {
        const level = statusCode >= 400 ? 'error' : 'info';
        logger[level](`Payment: ${action}`, {
            statusCode,
            ...meta,
        });
    },
};

module.exports = log;
