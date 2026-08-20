const modelFAQ = require('../models/faq.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');
const { askGeminiAI } = require('../utils/Chatbot/geminiAI');
const { askGeminiAI: askGeminiAIWithRAG } = require('../utils/Chatbot/geminiAIWithRAG');
const cacheManager = require('../utils/Chatbot/cacheManager');

// Flag Ä‘á»ƒ báº­t/táº¯t RAG mode
const USE_RAG_MODE = process.env.USE_RAG_MODE === 'true';

class ChatbotController {
    // Gá»­i cÃ¢u há»i cho chatbot
    async askQuestion(req, res) {
        const { question } = req.body;

        console.log('ðŸ“ Received question:', question);

        if (!question || question.trim() === '') {
            throw new BadRequestError('Vui lÃ²ng nháº­p cÃ¢u há»i');
        }

        // ðŸš€ CHECK CACHE FIRST
        // TEMPORARY: Skip cache to test new category search feature
        // const cachedFAQ = cacheManager.getFAQ(question);
        // if (cachedFAQ) {
        //     console.log('âš¡ Returning cached FAQ result');
        //     return new OK({
        //         message: 'TÃ¬m tháº¥y cÃ¢u tráº£ lá»i (cached)',
        //         metadata: cachedFAQ,
        //     }).send(res);
        // }

        // TÃ¬m kiáº¿m cÃ¢u há»i phÃ¹ há»£p
        // Sá»­ dá»¥ng text search trong MongoDB
        const faqs = await modelFAQ
            .find({
                isActive: true,
                $text: { $search: question },
            })
            .select('question answer category')
            .limit(5);

        // Lá»c káº¿t quáº£ cÃ³ Ä‘iá»ƒm sá»‘ cao (chá»‰ láº¥y náº¿u score >= 0.8)
        const relevantFaqs = faqs
            .map((faq) => {
                const faqQuestion = faq.question.toLowerCase();
                const userQuestion = question.toLowerCase();

                // TÃ­nh Ä‘á»™ tÆ°Æ¡ng Ä‘á»“ng vá»›i trá»ng sá»‘
                const words = userQuestion.split(' ').filter((w) => w.length > 2);
                let score = 0;

                words.forEach((word) => {
                    if (faqQuestion.includes(word)) {
                        // Tá»« khÃ³a quan trá»ng (Ä‘á»™ng tá»«, danh tá»«) cÃ³ trá»ng sá»‘ cao hÆ¡n
                        const isImportant = [
                            'thuÃª',
                            'tráº£',
                            'tÃ¬m',
                            'há»§y',
                            'thanh toÃ¡n',
                            'giao',
                            'liÃªn há»‡',
                            'Ä‘Äƒng kÃ½',
                        ].includes(word);
                        score += isImportant ? 2 : 1;
                    }
                });

                const similarity = score / (words.length * 1.5);

                return { ...faq.toObject(), similarity };
            })
            .filter((faq) => faq.similarity >= 0.7)
            .sort((a, b) => b.similarity - a.similarity);

        console.log('ðŸ“š Text search results:', faqs.length, 'â†’ Relevant:', relevantFaqs.length);
        if (relevantFaqs.length > 0) {
            console.log(
                '   Top match:',
                relevantFaqs[0].question,
                `(${(relevantFaqs[0].similarity * 100).toFixed(1)}%)`,
            );
        }

        if (relevantFaqs.length > 0) {
            // TÄƒng view count cho FAQ Ä‘Æ°á»£c chá»n
            await modelFAQ.findByIdAndUpdate(relevantFaqs[0]._id, {
                $inc: { viewCount: 1 },
            });

            const result = {
                found: true,
                answer: relevantFaqs[0].answer,
                source: 'faq',
                relatedQuestions: relevantFaqs.slice(1).map((f) => ({
                    id: f._id,
                    question: f.question,
                })),
            };

            // ðŸ’¾ CACHE RESULT
            cacheManager.setFAQ(question, result);

            return new OK({
                message: 'TÃ¬m tháº¥y cÃ¢u tráº£ lá»i',
                metadata: result,
            }).send(res);
        }

        // TÃ¬m kiáº¿m Ä‘Æ¡n giáº£n báº±ng regex náº¿u text search khÃ´ng cÃ³ káº¿t quáº£
        const regexSearch = await modelFAQ
            .find({
                isActive: true,
                $or: [
                    { question: { $regex: question, $options: 'i' } },
                    { keywords: { $in: [new RegExp(question, 'i')] } },
                ],
            })
            .select('question answer category')
            .limit(10);

        // Lá»c káº¿t quáº£ regex cÅ©ng cáº§n Ä‘á»™ chÃ­nh xÃ¡c
        const relevantRegex = regexSearch.filter((faq) => {
            const faqQuestion = faq.question.toLowerCase();
            const userQuestion = question.toLowerCase();

            const words = userQuestion.split(' ').filter((w) => w.length > 2);
            const matchCount = words.filter((w) => faqQuestion.includes(w)).length;
            const similarity = matchCount / words.length;

            return similarity >= 0.3; // Regex cÃ³ thá»ƒ ná»›i lá»ng hÆ¡n
        });

        console.log('ðŸ” Regex search results:', regexSearch.length, 'â†’ Relevant:', relevantRegex.length);

        if (relevantRegex.length > 0) {
            await modelFAQ.findByIdAndUpdate(relevantRegex[0]._id, {
                $inc: { viewCount: 1 },
            });

            return new OK({
                message: 'TÃ¬m tháº¥y cÃ¢u tráº£ lá»i',
                metadata: {
                    found: true,
                    answer: relevantRegex[0].answer,
                    source: 'faq',
                    relatedQuestions: relevantRegex.slice(1).map((f) => ({
                        id: f._id,
                        question: f.question,
                    })),
                },
            }).send(res);
        }

        // KhÃ´ng tÃ¬m tháº¥y trong FAQ â†’ Gá»i Gemini AI
        console.log('ðŸ¤– No FAQ found, calling Gemini AI with RAG...');

        try {
            const context = `
- ThÆ° viá»‡n cho thuÃª sÃ¡ch trá»±c tuyáº¿n
- Há»— trá»£ nhiá»u hÃ¬nh thá»©c thanh toÃ¡n
- Giao sÃ¡ch táº­n nÆ¡i miá»…n phÃ­ ná»™i thÃ nh
- LiÃªn há»‡: library@dav.edu.vn, Hotline: 0123-456-789
            `;

            // Chá»n version AI dá»±a trÃªn USE_RAG_MODE
            const aiFunction = USE_RAG_MODE ? askGeminiAIWithRAG : askGeminiAI;
            const aiResult = await aiFunction(question, context);

            console.log('âœ… Gemini AI response received:', typeof aiResult);

            // Handle different response types
            let responseData = {};

            if (typeof aiResult === 'string') {
                // Old format compatibility
                responseData = {
                    found: true,
                    answer: aiResult,
                    source: 'gemini-ai',
                    note: 'CÃ¢u tráº£ lá»i Ä‘Æ°á»£c táº¡o bá»Ÿi AI. Vui lÃ²ng liÃªn há»‡ admin Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£ chÃ­nh xÃ¡c hÆ¡n.',
                    relatedQuestions: [],
                };
            } else {
                // New format with RAG
                responseData = {
                    found: true,
                    answer: aiResult.answer,
                    source: aiResult.source,
                    relatedQuestions: [],
                    relatedBooks: aiResult.relatedBooks || [],
                    contextTerms: aiResult.contextTerms || [],
                };

                // ðŸ§® Handle calculation result (NEW)
                if (aiResult.calculation) {
                    responseData.calculation = aiResult.calculation;
                    responseData.directAnswer = true;
                }

                // ðŸ“š Handle category list (NEW)
                if (aiResult.categories) {
                    responseData.categories = aiResult.categories;
                    responseData.totalBooks = aiResult.totalBooks;
                    responseData.directAnswer = true;
                }

                // ðŸ“š Handle category search (NEW)
                if (aiResult.categoryFilter) {
                    responseData.categoryFilter = aiResult.categoryFilter;
                    responseData.directAnswer = true;
                }

                // Handle escalation
                if (aiResult.escalated) {
                    responseData.escalated = true;
                    responseData.contactInfo = aiResult.contactInfo;
                }

                // Handle policy rejection
                if (aiResult.rejected) {
                    responseData.rejected = true;
                }

                // Add note for AI-generated answers
                if (aiResult.source === 'gemini-ai') {
                    responseData.note = 'CÃ¢u tráº£ lá»i Ä‘Æ°á»£c táº¡o bá»Ÿi AI vá»›i dá»¯ liá»‡u thá»±c táº¿ tá»« thÆ° viá»‡n.';
                }
            }

            return new OK({
                message: aiResult.escalated
                    ? 'Chuyá»ƒn tiáº¿p Ä‘áº¿n nhÃ¢n viÃªn'
                    : aiResult.rejected
                    ? 'CÃ¢u há»i ngoÃ i pháº¡m vi'
                    : 'CÃ¢u tráº£ lá»i tá»« AI',
                metadata: responseData,
            }).send(res);
        } catch (error) {
            console.error('Gemini AI Error:', error);

            // Fallback náº¿u Gemini AI lá»—i
            return new OK({
                message: 'KhÃ´ng tÃ¬m tháº¥y cÃ¢u tráº£ lá»i',
                metadata: {
                    found: false,
                    answer: 'TÃ´i chÆ°a thá»ƒ tráº£ lá»i cÃ¢u há»i nÃ y. Vui lÃ²ng Ä‘á»£i admin pháº£n há»“i báº¡n nhÃ© !',
                    source: 'default',
                    relatedQuestions: [],
                },
            }).send(res);
        }
    }

    // Láº¥y cÃ¢u tráº£ lá»i theo ID
    async getAnswerById(req, res) {
        const { id } = req.params;

        const faq = await modelFAQ.findById(id);
        if (!faq) {
            throw new NotFoundError('KhÃ´ng tÃ¬m tháº¥y cÃ¢u há»i');
        }

        // TÄƒng view count
        await modelFAQ.findByIdAndUpdate(id, {
            $inc: { viewCount: 1 },
        });

        return new OK({
            message: 'Láº¥y cÃ¢u tráº£ lá»i thÃ nh cÃ´ng',
            metadata: faq,
        }).send(res);
    }

    // Láº¥y danh sÃ¡ch FAQ cho user
    async getPublicFAQs(req, res) {
        const { category } = req.query;

        const query = { isActive: true };
        if (category && category !== 'all') {
            query.category = category;
        }

        const faqs = await modelFAQ
            .find(query)
            .select('question answer category viewCount')
            .sort({ viewCount: -1 })
            .limit(20);

        return new OK({
            message: 'Láº¥y danh sÃ¡ch FAQ thÃ nh cÃ´ng',
            metadata: faqs,
        }).send(res);
    }

    // ==== ADMIN FUNCTIONS ====

    // Táº¡o FAQ má»›i
    async createFAQ(req, res) {
        const { question, answer, keywords, category } = req.body;

        if (!question || !answer) {
            throw new BadRequestError('Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ cÃ¢u há»i vÃ  cÃ¢u tráº£ lá»i');
        }

        const newFAQ = await modelFAQ.create({
            question,
            answer,
            keywords: keywords || [],
            category: category || 'general',
        });

        // ðŸ—‘ï¸ Clear cache khi táº¡o FAQ má»›i
        cacheManager.clearFAQCache();

        return new Created({
            message: 'Táº¡o FAQ thÃ nh cÃ´ng',
            metadata: newFAQ,
        }).send(res);
    }

    // Láº¥y táº¥t cáº£ FAQ (cho admin)
    async getAllFAQs(req, res) {
        const { category, isActive, search } = req.query;

        const query = {};

        if (category && category !== 'all') {
            query.category = category;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        if (search) {
            query.$or = [
                { question: { $regex: search, $options: 'i' } },
                { answer: { $regex: search, $options: 'i' } },
            ];
        }

        const faqs = await modelFAQ.find(query).sort({ createdAt: -1 });

        return new OK({
            message: 'Láº¥y danh sÃ¡ch FAQ thÃ nh cÃ´ng',
            metadata: faqs,
        }).send(res);
    }

    // Cáº­p nháº­t FAQ
    async updateFAQ(req, res) {
        const { id } = req.params;
        const { question, answer, keywords, category, isActive } = req.body;

        const faq = await modelFAQ.findById(id);
        if (!faq) {
            throw new NotFoundError('KhÃ´ng tÃ¬m tháº¥y FAQ');
        }

        if (question) faq.question = question;
        if (answer) faq.answer = answer;
        if (keywords !== undefined) faq.keywords = keywords;
        if (category) faq.category = category;
        if (isActive !== undefined) faq.isActive = isActive;

        await faq.save();

        // ðŸ—‘ï¸ Clear cache khi update FAQ
        cacheManager.clearFAQCache();

        return new OK({
            message: 'Cáº­p nháº­t FAQ thÃ nh cÃ´ng',
            metadata: faq,
        }).send(res);
    }

    // XÃ³a FAQ
    async deleteFAQ(req, res) {
        const { id } = req.params;

        const faq = await modelFAQ.findByIdAndDelete(id);
        if (!faq) {
            throw new NotFoundError('KhÃ´ng tÃ¬m tháº¥y FAQ');
        }

        // ðŸ—‘ï¸ Clear cache khi xÃ³a FAQ
        cacheManager.clearFAQCache();

        return new OK({
            message: 'XÃ³a FAQ thÃ nh cÃ´ng',
            metadata: { id },
        }).send(res);
    }

    // Toggle tráº¡ng thÃ¡i FAQ
    async toggleFAQStatus(req, res) {
        const { id } = req.params;

        const faq = await modelFAQ.findById(id);
        if (!faq) {
            throw new NotFoundError('KhÃ´ng tÃ¬m tháº¥y FAQ');
        }

        faq.isActive = !faq.isActive;
        await faq.save();

        return new OK({
            message: 'Cáº­p nháº­t tráº¡ng thÃ¡i FAQ thÃ nh cÃ´ng',
            metadata: faq,
        }).send(res);
    }

    // XÃ³a nhiá»u FAQ (bulk delete)
    async bulkDeleteFAQs(req, res) {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new BadRequestError('Vui lÃ²ng cung cáº¥p danh sÃ¡ch ID cáº§n xÃ³a');
        }

        const result = await modelFAQ.deleteMany({ _id: { $in: ids } });

        // ðŸ—‘ï¸ Clear cache khi xÃ³a FAQ
        cacheManager.clearFAQCache();

        return new OK({
            message: `XÃ³a thÃ nh cÃ´ng ${result.deletedCount} FAQ`,
            metadata: { deletedCount: result.deletedCount, ids },
        }).send(res);
    }

    // Import FAQ tá»« CSV/JSON
    async importFAQs(req, res) {
        const { faqs } = req.body;

        if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
            throw new BadRequestError('Vui lÃ²ng cung cáº¥p danh sÃ¡ch FAQ');
        }

        // Validate format
        const validFAQs = faqs.filter(
            (faq) => faq.question && faq.answer && typeof faq.question === 'string' && typeof faq.answer === 'string',
        );

        if (validFAQs.length === 0) {
            throw new BadRequestError('KhÃ´ng cÃ³ FAQ há»£p lá»‡ nÃ o trong dá»¯ liá»‡u import');
        }

        // Format data
        const faqsToInsert = validFAQs.map((faq) => ({
            question: faq.question.trim(),
            answer: faq.answer.trim(),
            category: faq.category || 'other',
            keywords: Array.isArray(faq.keywords)
                ? faq.keywords
                : faq.keywords
                ? faq.keywords
                      .split(',')
                      .map((k) => k.trim())
                      .filter(Boolean)
                : [],
            isActive: faq.isActive !== undefined ? faq.isActive : true,
            viewCount: 0,
        }));

        // Insert vÃ o database
        const result = await modelFAQ.insertMany(faqsToInsert, { ordered: false });

        // ðŸ—‘ï¸ Clear cache
        cacheManager.clearFAQCache();

        return new Created({
            message: `Import thÃ nh cÃ´ng ${result.length} FAQ`,
            metadata: {
                imported: result.length,
                skipped: faqs.length - validFAQs.length,
                total: faqs.length,
            },
        }).send(res);
    }
}

module.exports = new ChatbotController();

