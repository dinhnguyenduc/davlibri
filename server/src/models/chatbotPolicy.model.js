const mongoose = require('mongoose');

// Schema cho chÃ­nh sÃ¡ch/quy táº¯c chatbot
const chatbotPolicySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
        },
        systemPrompt: {
            type: String,
            required: true,
        },
        rules: {
            truthfulness: {
                enabled: {
                    type: Boolean,
                    default: true,
                },
                message: {
                    type: String,
                    default: 'ThÆ° viá»‡n hiá»‡n khÃ´ng cÃ³ thÃ´ng tin nÃ y. Vui lÃ²ng liÃªn há»‡ thá»§ thÆ° Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£.',
                },
            },
            scopeLimitation: {
                enabled: {
                    type: Boolean,
                    default: true,
                },
                allowedTopics: {
                    type: [String],
                    default: ['sÃ¡ch', 'thÆ° viá»‡n', 'há»c thuáº­t', 'tra cá»©u', 'thá»§ tá»¥c'],
                },
                rejectionMessage: {
                    type: String,
                    default:
                        'Xin lá»—i, tÃ´i chá»‰ cÃ³ thá»ƒ tráº£ lá»i cÃ¡c cÃ¢u há»i liÃªn quan Ä‘áº¿n thÆ° viá»‡n vÃ  sÃ¡ch. Vui lÃ²ng há»i vá» cÃ¡c chá»§ Ä‘á» khÃ¡c.',
                },
            },
            copyrightProtection: {
                enabled: {
                    type: Boolean,
                    default: true,
                },
                maxSummaryLength: {
                    type: Number,
                    default: 500, // Giá»›i háº¡n kÃ½ tá»± tÃ³m táº¯t
                },
                warningMessage: {
                    type: String,
                    default: 'TÃ´i chá»‰ cÃ³ thá»ƒ cung cáº¥p tÃ³m táº¯t ná»™i dung. Äá»ƒ Ä‘á»c toÃ n vÄƒn, vui lÃ²ng thuÃª sÃ¡ch.',
                },
            },
            escalation: {
                enabled: {
                    type: Boolean,
                    default: true,
                },
                triggers: {
                    type: [String],
                    default: ['tranh cháº¥p', 'khiáº¿u náº¡i', 'máº¥t tháº»', 'há»ng sÃ¡ch', 'pháº¡t tiá»n', 'hoÃ n tiá»n'],
                },
                contactInfo: {
                    email: {
                        type: String,
                        default: 'library@dav.edu.vn',
                    },
                    phone: {
                        type: String,
                        default: '0123-456-789',
                    },
                    message: {
                        type: String,
                        default:
                            'Váº¥n Ä‘á» nÃ y cáº§n Ä‘Æ°á»£c giáº£i quyáº¿t bá»Ÿi cÃ¡n bá»™ thÆ° viá»‡n. Vui lÃ²ng liÃªn há»‡: {email} hoáº·c gá»i {phone}',
                    },
                },
            },
        },
        contextDictionary: {
            type: Map,
            of: String,
            default: new Map([
                ['ASEAN', 'Hiá»‡p há»™i cÃ¡c quá»‘c gia ÄÃ´ng Nam Ã'],
                ['UN', 'LiÃªn Há»£p Quá»‘c'],
                ['WTO', 'Tá»• chá»©c ThÆ°Æ¡ng máº¡i Tháº¿ giá»›i'],
                ['Biá»ƒn ÄÃ´ng', 'VÃ¹ng biá»ƒn tranh cháº¥p giá»¯a cÃ¡c quá»‘c gia chÃ¢u Ã'],
                ['NATO', 'Tá»• chá»©c Hiá»‡p Æ°á»›c Báº¯c Äáº¡i TÃ¢y DÆ°Æ¡ng'],
                ['EU', 'LiÃªn minh chÃ¢u Ã‚u'],
            ]),
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        priority: {
            type: Number,
            default: 0,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
        },
    },
    {
        timestamps: true,
        collection: 'chatbotPolicies',
    },
);

// Method Ä‘á»ƒ build system prompt Ä‘áº§y Ä‘á»§
chatbotPolicySchema.methods.buildSystemPrompt = function (additionalContext = '') {
    let prompt = this.systemPrompt;

    // ThÃªm context dictionary
    if (this.contextDictionary && this.contextDictionary.size > 0) {
        prompt += '\n\nThuáº­t ngá»¯ quan trá»ng:\n';
        this.contextDictionary.forEach((value, key) => {
            prompt += `- ${key}: ${value}\n`;
        });
    }

    // ThÃªm quy táº¯c
    if (this.rules.truthfulness.enabled) {
        prompt += `\n\nQuy táº¯c trung thá»±c: Náº¿u khÃ´ng tÃ¬m tháº¥y thÃ´ng tin chÃ­nh xÃ¡c, hÃ£y tráº£ lá»i: "${this.rules.truthfulness.message}"`;
    }

    if (this.rules.scopeLimitation.enabled) {
        prompt += `\n\nPháº¡m vi: Chá»‰ tráº£ lá»i vá» ${this.rules.scopeLimitation.allowedTopics.join(
            ', ',
        )}. CÃ¡c chá»§ Ä‘á» khÃ¡c tá»« chá»‘i lá»‹ch sá»±.`;
    }

    if (this.rules.escalation.enabled) {
        prompt += `\n\nChuyá»ƒn tiáº¿p: Náº¿u cÃ¢u há»i chá»©a "${this.rules.escalation.triggers.join(
            '", "',
        )}", cung cáº¥p thÃ´ng tin liÃªn há»‡: ${this.rules.escalation.contactInfo.email} hoáº·c ${
            this.rules.escalation.contactInfo.phone
        }`;
    }

    if (additionalContext) {
        prompt += `\n\nThÃ´ng tin bá»• sung:\n${additionalContext}`;
    }

    return prompt;
};

const modelChatbotPolicy = mongoose.model('ChatbotPolicy', chatbotPolicySchema);

module.exports = modelChatbotPolicy;

