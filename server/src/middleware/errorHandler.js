/**
 * Centralized Error Handler Middleware
 * Handles all types of errors with consistent response format
 */

const logger = require('../utils/logger');

// Custom Error Class
class AppError extends Error {
    constructor(message, statusCode, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

// Validation Error Handler
const validationError = (errors) => {
    const message = Object.values(errors)
        .map((error) => error.message)
        .join(', ');
    return new AppError(message, 400, 'VALIDATION_ERROR');
};

// MongoDB Cast Error Handler
const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400, 'INVALID_ID');
};

// MongoDB Duplicate Key Error Handler
const handleDuplicateKeyError = (err) => {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} already exists`;
    return new AppError(message, 409, 'DUPLICATE_KEY');
};

// JWT Error Handler
const handleJWTError = () => {
    return new AppError('Invalid or expired token', 401, 'JWT_ERROR');
};

// Main Error Handler Middleware
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';
    err.code = err.code || 'SERVER_ERROR';

    // MongoDB Errors
    if (err.name === 'CastError') {
        err = handleCastError(err);
    }
    if (err.code === 11000) {
        err = handleDuplicateKeyError(err);
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        err = handleJWTError();
    }
    if (err.name === 'TokenExpiredError') {
        err = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    }

    // Validation Errors (Mongoose)
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
            .map((val) => val.message)
            .join(', ');
        err = new AppError(message, 400, 'VALIDATION_ERROR');
    }

    // File Upload Errors
    if (err.name === 'MulterError') {
        if (err.code === 'FILE_TOO_LARGE') {
            err = new AppError('File size exceeds 10MB limit', 400, 'FILE_TOO_LARGE');
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            err = new AppError('Too many files uploaded', 400, 'LIMIT_FILE_COUNT');
        }
    }

    // Log error
    const errorLog = {
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString(),
    };

    if (err.statusCode >= 500) {
        logger.error('Server Error', errorLog);
    } else {
        logger.warn('Client Error', errorLog);
    }

    // Response
    res.status(err.statusCode).json({
        success: false,
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        timestamp: err.timestamp,
    });
};

// Async Handler Wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation Middleware
const validateRequest = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
        return next(new AppError(error.details.map((d) => d.message).join(', '), 400, 'VALIDATION_ERROR'));
    }
    req.body = value;
    next();
};

// Protected Route Middleware
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return next(new AppError('Please login to access this resource', 401, 'NOT_AUTHENTICATED'));
    }
    next();
};

// Role-based Access Control
const authorize =
    (...roles) =>
    (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Please login first', 401, 'NOT_AUTHENTICATED'));
        }
        if (!roles.includes(req.user.role)) {
            return next(new AppError(`Only ${roles.join(', ')} can access this resource`, 403, 'FORBIDDEN'));
        }
        next();
    };

module.exports = {
    errorHandler,
    asyncHandler,
    validateRequest,
    requireAuth,
    authorize,
    AppError,
    validationError,
};
