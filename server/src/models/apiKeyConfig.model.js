const mongoose = require('mongoose');
const crypto = require('crypto');

// Ensure key is exactly 32 bytes
const ENCRYPTION_KEY = crypto.scryptSync(process.env.API_KEY_ENCRYPTION_SECRET || 'default-secret-key', 'salt', 32);
const IV_LENGTH = 16;

// Schema cho cấu hình API Key
const apiKeyConfigSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            enum: ['gemini', 'openai', 'claude', 'other'],
            required: true,
            default: 'gemini',
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        encryptedKey: {
            type: String,
            required: true,
        },
        iv: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        usageStats: {
            totalRequests: {
                type: Number,
                default: 0,
            },
            successfulRequests: {
                type: Number,
                default: 0,
            },
            failedRequests: {
                type: Number,
                default: 0,
            },
            lastUsed: {
                type: Date,
            },
        },
        quotaLimits: {
            dailyLimit: {
                type: Number,
                default: 1000,
            },
            monthlyLimit: {
                type: Number,
                default: 30000,
            },
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
        },
    },
    {
        timestamps: true,
        collection: 'apiKeyConfigs',
    },
);

// Method để encrypt API key
apiKeyConfigSchema.statics.encryptApiKey = function (apiKey) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(apiKey);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        encryptedKey: encrypted.toString('hex'),
        iv: iv.toString('hex'),
    };
};

// Method để decrypt API key
apiKeyConfigSchema.methods.decryptApiKey = function () {
    const iv = Buffer.from(this.iv, 'hex');
    const encryptedText = Buffer.from(this.encryptedKey, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

// Method để ẩn API key khi trả về client
apiKeyConfigSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.encryptedKey;
    delete obj.iv;
    // Chỉ show 4 ký tự cuối của key
    obj.maskedKey = '***' + this.decryptApiKey().slice(-4);
    return obj;
};

const modelApiKeyConfig = mongoose.model('ApiKeyConfig', apiKeyConfigSchema);

module.exports = modelApiKeyConfig;
