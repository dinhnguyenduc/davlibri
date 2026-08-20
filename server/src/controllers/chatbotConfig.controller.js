const modelApiKeyConfig = require('../models/apiKeyConfig.model');
const modelChatbotPolicy = require('../models/chatbotPolicy.model');
const modelContextDictionary = require('../models/contextDictionary.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');

class ChatbotConfigController {
    // ============ API KEY MANAGEMENT ============

    // Tạo API key mới
    async createApiKey(req, res) {
        const { provider, name, apiKey, dailyLimit, monthlyLimit } = req.body;

        if (!name || !apiKey) {
            throw new BadRequestError('Vui lòng nhập đầy đủ tên và API key');
        }

        // Encrypt API key
        const { encryptedKey, iv } = modelApiKeyConfig.encryptApiKey(apiKey);

        const newApiKey = await modelApiKeyConfig.create({
            provider: provider || 'gemini',
            name,
            encryptedKey,
            iv,
            quotaLimits: {
                dailyLimit: dailyLimit || 1000,
                monthlyLimit: monthlyLimit || 30000,
            },
            createdBy: req.user?._id,
        });

        return new Created({
            message: 'Tạo API key thành công',
            metadata: newApiKey,
        }).send(res);
    }

    // Lấy danh sách API keys
    async getAllApiKeys(req, res) {
        const apiKeys = await modelApiKeyConfig.find().sort({ createdAt: -1 });

        return new OK({
            message: 'Lấy danh sách API keys thành công',
            metadata: apiKeys,
        }).send(res);
    }

    // Lấy API key đang active
    async getActiveApiKey(req, res) {
        const { provider } = req.query;

        const activeKey = await modelApiKeyConfig.findOne({
            isActive: true,
            provider: provider || 'gemini',
        });

        if (!activeKey) {
            throw new NotFoundError('Không tìm thấy API key đang hoạt động');
        }

        return new OK({
            message: 'Lấy API key thành công',
            metadata: activeKey,
        }).send(res);
    }

    // Cập nhật API key
    async updateApiKey(req, res) {
        const { id } = req.params;
        const { name, apiKey, isActive, dailyLimit, monthlyLimit } = req.body;

        const keyConfig = await modelApiKeyConfig.findById(id);
        if (!keyConfig) {
            throw new NotFoundError('Không tìm thấy API key');
        }

        if (name) keyConfig.name = name;
        if (isActive !== undefined) keyConfig.isActive = isActive;

        if (apiKey) {
            const { encryptedKey, iv } = modelApiKeyConfig.encryptApiKey(apiKey);
            keyConfig.encryptedKey = encryptedKey;
            keyConfig.iv = iv;
        }

        if (dailyLimit) keyConfig.quotaLimits.dailyLimit = dailyLimit;
        if (monthlyLimit) keyConfig.quotaLimits.monthlyLimit = monthlyLimit;

        await keyConfig.save();

        return new OK({
            message: 'Cập nhật API key thành công',
            metadata: keyConfig,
        }).send(res);
    }

    // Xóa API key
    async deleteApiKey(req, res) {
        const { id } = req.params;

        const keyConfig = await modelApiKeyConfig.findByIdAndDelete(id);
        if (!keyConfig) {
            throw new NotFoundError('Không tìm thấy API key');
        }

        return new OK({
            message: 'Xóa API key thành công',
            metadata: { id },
        }).send(res);
    }

    // Thống kê sử dụng API key
    async getApiKeyStats(req, res) {
        const { id } = req.params;

        const keyConfig = await modelApiKeyConfig.findById(id);
        if (!keyConfig) {
            throw new NotFoundError('Không tìm thấy API key');
        }

        return new OK({
            message: 'Lấy thống kê thành công',
            metadata: {
                name: keyConfig.name,
                provider: keyConfig.provider,
                stats: keyConfig.usageStats,
                limits: keyConfig.quotaLimits,
            },
        }).send(res);
    }

    // ============ POLICY MANAGEMENT ============

    // Tạo policy mới
    async createPolicy(req, res) {
        const { name, description, systemPrompt, rules, contextDictionary } = req.body;

        if (!name || !systemPrompt) {
            throw new BadRequestError('Vui lòng nhập đầy đủ tên và system prompt');
        }

        const newPolicy = await modelChatbotPolicy.create({
            name,
            description,
            systemPrompt,
            rules,
            contextDictionary: contextDictionary ? new Map(Object.entries(contextDictionary)) : undefined,
            createdBy: req.user?._id,
        });

        return new Created({
            message: 'Tạo policy thành công',
            metadata: newPolicy,
        }).send(res);
    }

    // Lấy danh sách policies
    async getAllPolicies(req, res) {
        const policies = await modelChatbotPolicy.find().sort({ priority: -1, createdAt: -1 });

        return new OK({
            message: 'Lấy danh sách policies thành công',
            metadata: policies,
        }).send(res);
    }

    // Lấy policy đang active
    async getActivePolicy(req, res) {
        const policy = await modelChatbotPolicy.findOne({ isActive: true }).sort({ priority: -1 });

        if (!policy) {
            throw new NotFoundError('Không tìm thấy policy đang hoạt động');
        }

        return new OK({
            message: 'Lấy policy thành công',
            metadata: policy,
        }).send(res);
    }

    // Cập nhật policy
    async updatePolicy(req, res) {
        const { id } = req.params;
        const { name, description, systemPrompt, rules, contextDictionary, isActive, priority } = req.body;

        const policy = await modelChatbotPolicy.findById(id);
        if (!policy) {
            throw new NotFoundError('Không tìm thấy policy');
        }

        if (name) policy.name = name;
        if (description) policy.description = description;
        if (systemPrompt) policy.systemPrompt = systemPrompt;
        if (rules) policy.rules = { ...policy.rules, ...rules };
        if (contextDictionary) {
            policy.contextDictionary = new Map(Object.entries(contextDictionary));
        }
        if (isActive !== undefined) policy.isActive = isActive;
        if (priority !== undefined) policy.priority = priority;

        await policy.save();

        return new OK({
            message: 'Cập nhật policy thành công',
            metadata: policy,
        }).send(res);
    }

    // Xóa policy
    async deletePolicy(req, res) {
        const { id } = req.params;

        const policy = await modelChatbotPolicy.findByIdAndDelete(id);
        if (!policy) {
            throw new NotFoundError('Không tìm thấy policy');
        }

        return new OK({
            message: 'Xóa policy thành công',
            metadata: { id },
        }).send(res);
    }

    // ============ CONTEXT DICTIONARY MANAGEMENT ============

    // Thêm thuật ngữ mới
    async addContextTerm(req, res) {
        const { term, definition, category, aliases, relatedTerms } = req.body;

        if (!term || !definition) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thuật ngữ và định nghĩa');
        }

        const newTerm = await modelContextDictionary.create({
            term,
            definition,
            category,
            aliases,
            relatedTerms,
        });

        return new Created({
            message: 'Thêm thuật ngữ thành công',
            metadata: newTerm,
        }).send(res);
    }

    // Lấy danh sách thuật ngữ
    async getAllContextTerms(req, res) {
        const { category, search } = req.query;

        const query = {};
        if (category && category !== 'all') {
            query.category = category;
        }
        if (search) {
            query.$text = { $search: search };
        }

        const terms = await modelContextDictionary.find(query).sort({ term: 1 });

        return new OK({
            message: 'Lấy danh sách thuật ngữ thành công',
            metadata: terms,
        }).send(res);
    }

    // Cập nhật thuật ngữ
    async updateContextTerm(req, res) {
        const { id } = req.params;
        const { term, definition, category, aliases, relatedTerms, isActive } = req.body;

        const contextTerm = await modelContextDictionary.findById(id);
        if (!contextTerm) {
            throw new NotFoundError('Không tìm thấy thuật ngữ');
        }

        if (term) contextTerm.term = term;
        if (definition) contextTerm.definition = definition;
        if (category) contextTerm.category = category;
        if (aliases) contextTerm.aliases = aliases;
        if (relatedTerms) contextTerm.relatedTerms = relatedTerms;
        if (isActive !== undefined) contextTerm.isActive = isActive;

        await contextTerm.save();

        return new OK({
            message: 'Cập nhật thuật ngữ thành công',
            metadata: contextTerm,
        }).send(res);
    }

    // Xóa thuật ngữ
    async deleteContextTerm(req, res) {
        const { id } = req.params;

        const contextTerm = await modelContextDictionary.findByIdAndDelete(id);
        if (!contextTerm) {
            throw new NotFoundError('Không tìm thấy thuật ngữ');
        }

        return new OK({
            message: 'Xóa thuật ngữ thành công',
            metadata: { id },
        }).send(res);
    }
}

module.exports = new ChatbotConfigController();
