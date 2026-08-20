require('dotenv').config();
const connectDB = require('./src/config/connectDB');
const modelChatbotPolicy = require('./src/models/chatbotPolicy.model');
const modelContextDictionary = require('./src/models/contextDictionary.model');
const modelApiKeyConfig = require('./src/models/apiKeyConfig.model');

async function seedChatbotConfig() {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        // 1. Seed API Key Config
        console.log('\nðŸ“ Seeding API Key Config...');
        const existingApiKey = await modelApiKeyConfig.findOne({ provider: 'gemini' });

        if (!existingApiKey && process.env.GEMINI_API_KEY) {
            const { encryptedKey, iv } = modelApiKeyConfig.encryptApiKey(process.env.GEMINI_API_KEY);

            await modelApiKeyConfig.create({
                provider: 'gemini',
                name: 'Gemini API Key - Production',
                encryptedKey,
                iv,
                isActive: true,
                quotaLimits: {
                    dailyLimit: 1000,
                    monthlyLimit: 30000,
                },
            });
            console.log('âœ… API Key config created');
        } else {
            console.log('â­ï¸  API Key already exists');
        }

        // 2. Seed Default Policy
        console.log('\nðŸ“ Seeding Default Policy...');
        const existingPolicy = await modelChatbotPolicy.findOne({ name: 'Default Library Policy' });

        if (!existingPolicy) {
            const policy = await modelChatbotPolicy.create({
                name: 'Default Library Policy',
                description: 'ChÃ­nh sÃ¡ch máº·c Ä‘á»‹nh cho chatbot thÆ° viá»‡n',
                systemPrompt: `Báº¡n lÃ  trá»£ lÃ½ áº£o thÃ´ng minh cá»§a ThÆ° viá»‡n SÃ¡ch Trá»±c Tuyáº¿n.

NHIá»†M Vá»¤ Cá»¦A Báº N:
- TÆ° váº¥n, há»— trá»£ ngÆ°á»i dÃ¹ng vá» sÃ¡ch vÃ  dá»‹ch vá»¥ thÆ° viá»‡n
- GiÃºp tÃ¬m kiáº¿m sÃ¡ch phÃ¹ há»£p vá»›i nhu cáº§u
- HÆ°á»›ng dáº«n thá»§ tá»¥c thuÃª/tráº£ sÃ¡ch, thanh toÃ¡n
- Giáº£i Ä‘Ã¡p tháº¯c máº¯c vá» há»c thuáº­t, nghiÃªn cá»©u

QUY Táº®C VÃ€NG:
1. TRUNG THá»°C: Náº¿u khÃ´ng tÃ¬m tháº¥y thÃ´ng tin, hÃ£y thá»«a nháº­n. KHÃ”NG bá»‹a Ä‘áº·t.
2. CHÃNH XÃC: Dá»±a vÃ o dá»¯ liá»‡u thá»±c táº¿ tá»« database thÆ° viá»‡n.
3. THÃ‚N THIá»†N: DÃ¹ng giá»ng Ä‘iá»‡u gáº§n gÅ©i, dá»… hiá»ƒu.
4. TÃ”N TRá»ŒNG: KhÃ´ng cung cáº¥p toÃ n vÄƒn sÃ¡ch cÃ³ báº£n quyá»n.`,
                rules: {
                    truthfulness: {
                        enabled: true,
                        message:
                            'ThÆ° viá»‡n hiá»‡n khÃ´ng cÃ³ thÃ´ng tin nÃ y. Vui lÃ²ng liÃªn há»‡ thá»§ thÆ° Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£: library@dav.edu.vn hoáº·c 0123-456-789',
                    },
                    scopeLimitation: {
                        enabled: true,
                        allowedTopics: [
                            'sÃ¡ch',
                            'thÆ° viá»‡n',
                            'há»c thuáº­t',
                            'tra cá»©u',
                            'thá»§ tá»¥c',
                            'thuÃª sÃ¡ch',
                            'tráº£ sÃ¡ch',
                            'thanh toÃ¡n',
                        ],
                        rejectionMessage:
                            'Xin lá»—i, tÃ´i chá»‰ cÃ³ thá»ƒ há»— trá»£ cÃ¡c váº¥n Ä‘á» vá» thÆ° viá»‡n vÃ  sÃ¡ch. Vá»›i cÃ¢u há»i nÃ y, báº¡n cÃ³ thá»ƒ tham kháº£o cÃ¡c nguá»“n khÃ¡c nhÃ©! ðŸ˜Š',
                    },
                    copyrightProtection: {
                        enabled: true,
                        maxSummaryLength: 500,
                        warningMessage:
                            'TÃ´i chá»‰ cÃ³ thá»ƒ cung cáº¥p tÃ³m táº¯t ngáº¯n gá»n. Äá»ƒ Ä‘á»c toÃ n vÄƒn, vui lÃ²ng thuÃª sÃ¡ch táº¡i thÆ° viá»‡n.',
                    },
                    escalation: {
                        enabled: true,
                        triggers: [
                            'tranh cháº¥p',
                            'khiáº¿u náº¡i',
                            'máº¥t tháº»',
                            'há»ng sÃ¡ch',
                            'pháº¡t tiá»n',
                            'hoÃ n tiá»n',
                            'khiáº¿u kiá»‡n',
                        ],
                        contactInfo: {
                            email: 'library@dav.edu.vn',
                            phone: '0123-456-789',
                            message:
                                'Váº¥n Ä‘á» nÃ y cáº§n Ä‘Æ°á»£c giáº£i quyáº¿t trá»±c tiáº¿p bá»Ÿi cÃ¡n bá»™ thÆ° viá»‡n. Vui lÃ²ng liÃªn há»‡:\nðŸ“§ Email: {email}\nðŸ“ž Hotline: {phone}\nChÃºng tÃ´i sáº½ pháº£n há»“i trong vÃ²ng 24h.',
                        },
                    },
                },
                contextDictionary: new Map([
                    ['ASEAN', 'Hiá»‡p há»™i cÃ¡c quá»‘c gia ÄÃ´ng Nam Ã (Association of Southeast Asian Nations)'],
                    ['UN', 'LiÃªn Há»£p Quá»‘c (United Nations)'],
                    ['WTO', 'Tá»• chá»©c ThÆ°Æ¡ng máº¡i Tháº¿ giá»›i (World Trade Organization)'],
                    ['Biá»ƒn ÄÃ´ng', 'VÃ¹ng biá»ƒn tranh cháº¥p chá»§ quyá»n giá»¯a cÃ¡c quá»‘c gia chÃ¢u Ã-ThÃ¡i BÃ¬nh DÆ°Æ¡ng'],
                    ['NATO', 'Tá»• chá»©c Hiá»‡p Æ°á»›c Báº¯c Äáº¡i TÃ¢y DÆ°Æ¡ng (North Atlantic Treaty Organization)'],
                    ['EU', 'LiÃªn minh chÃ¢u Ã‚u (European Union)'],
                    ['IMF', 'Quá»¹ Tiá»n tá»‡ Quá»‘c táº¿ (International Monetary Fund)'],
                    ['UNESCO', 'Tá»• chá»©c GiÃ¡o dá»¥c, Khoa há»c vÃ  VÄƒn hÃ³a LiÃªn Há»£p Quá»‘c'],
                ]),
                isActive: true,
                priority: 100,
            });
            console.log('âœ… Default policy created');
        } else {
            console.log('â­ï¸  Policy already exists');
        }

        // 3. Seed Context Dictionary
        console.log('\nðŸ“ Seeding Context Dictionary...');
        const termsToAdd = [
            {
                term: 'ASEAN',
                definition: 'Hiá»‡p há»™i cÃ¡c quá»‘c gia ÄÃ´ng Nam Ã, gá»“m 10 nÆ°á»›c thÃ nh viÃªn, thÃ nh láº­p nÄƒm 1967',
                category: 'politics',
                aliases: ['Asean', 'hiá»‡p há»™i Ä‘Ã´ng nam Ã¡'],
                relatedTerms: ['Viá»‡t Nam', 'ÄÃ´ng Nam Ã', 'Ngoáº¡i giao'],
            },
            {
                term: 'UN',
                definition: 'LiÃªn Há»£p Quá»‘c - tá»• chá»©c quá»‘c táº¿ lá»›n nháº¥t tháº¿ giá»›i vá» hÃ²a bÃ¬nh vÃ  an ninh',
                category: 'diplomacy',
                aliases: ['United Nations', 'LiÃªn hiá»‡p quá»‘c', 'LHQ'],
                relatedTerms: ['Ngoáº¡i giao', 'HÃ²a bÃ¬nh', 'An ninh quá»‘c táº¿'],
            },
            {
                term: 'WTO',
                definition: 'Tá»• chá»©c ThÆ°Æ¡ng máº¡i Tháº¿ giá»›i - Ä‘iá»u tiáº¿t thÆ°Æ¡ng máº¡i quá»‘c táº¿',
                category: 'economics',
                aliases: ['World Trade Organization'],
                relatedTerms: ['ThÆ°Æ¡ng máº¡i', 'Xuáº¥t nháº­p kháº©u', 'Kinh táº¿ quá»‘c táº¿'],
            },
            {
                term: 'Biá»ƒn ÄÃ´ng',
                definition: 'VÃ¹ng biá»ƒn quan trá»ng vá» chiáº¿n lÆ°á»£c vÃ  kinh táº¿ á»Ÿ ÄÃ´ng Nam Ã, cÃ³ tranh cháº¥p chá»§ quyá»n',
                category: 'politics',
                aliases: ['South China Sea', 'Bien Dong'],
                relatedTerms: ['Chá»§ quyá»n', 'Quáº§n Ä‘áº£o TrÆ°á»ng Sa', 'Quáº§n Ä‘áº£o HoÃ ng Sa'],
            },
            {
                term: 'NATO',
                definition: 'Tá»• chá»©c Hiá»‡p Æ°á»›c Báº¯c Äáº¡i TÃ¢y DÆ°Æ¡ng - liÃªn minh quÃ¢n sá»± cÃ¡c nÆ°á»›c phÆ°Æ¡ng TÃ¢y',
                category: 'diplomacy',
                aliases: ['North Atlantic Treaty Organization'],
                relatedTerms: ['An ninh', 'QuÃ¢n sá»±', 'LiÃªn minh'],
            },
            {
                term: 'EU',
                definition: 'LiÃªn minh chÃ¢u Ã‚u - liÃªn minh chÃ­nh trá»‹ vÃ  kinh táº¿ gá»“m 27 quá»‘c gia chÃ¢u Ã‚u',
                category: 'politics',
                aliases: ['European Union', 'LiÃªn minh ChÃ¢u Ã‚u'],
                relatedTerms: ['ChÃ¢u Ã‚u', 'Há»™i nháº­p', 'Kinh táº¿'],
            },
        ];

        for (const term of termsToAdd) {
            const existing = await modelContextDictionary.findOne({ term: term.term });
            if (!existing) {
                await modelContextDictionary.create(term);
                console.log(`âœ… Added term: ${term.term}`);
            }
        }

        console.log('\nðŸŽ‰ Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('âŒ Seed error:', error);
        process.exit(1);
    }
}

seedChatbotConfig();

