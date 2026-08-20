const modelApiKeyConfig = require('../../models/apiKeyConfig.model');
const modelChatbotPolicy = require('../../models/chatbotPolicy.model');
const modelContextDictionary = require('../../models/contextDictionary.model');
const Book = require('../../models/books.model');
const modelCategory = require('../../models/category.model');
const { parseQuery, calculateRentalCost } = require('./queryParser');
const { hybridSearch } = require('../../services/hybridSearch.service'); // 🆕 CHƯƠNG 3.3.2
require('dotenv').config();

/**
 * Lấy API key đang active từ database
 */
async function getActiveApiKey() {
    try {
        const keyConfig = await modelApiKeyConfig.findOne({
            isActive: true,
            provider: 'gemini',
        });

        if (!keyConfig) {
            return process.env.GEMINI_API_KEY;
        }

        // Cập nhật usage stats
        await modelApiKeyConfig.findByIdAndUpdate(keyConfig._id, {
            $inc: { 'usageStats.totalRequests': 1 },
            $set: { 'usageStats.lastUsed': new Date() },
        });

        return keyConfig.decryptApiKey();
    } catch (error) {
        console.error('Error getting API key:', error);
        return process.env.GEMINI_API_KEY;
    }
}

/**
 * Lấy policy đang active
 */
async function getActivePolicy() {
    try {
        const policy = await modelChatbotPolicy.findOne({ isActive: true }).sort({ priority: -1 });
        return policy;
    } catch (error) {
        console.error('Error getting policy:', error);
        return null;
    }
}

/**
 * Tìm thuật ngữ trong context dictionary
 */
async function findContextTerms(question) {
    try {
        const terms = await modelContextDictionary.find({
            isActive: true,
            $or: [{ term: { $regex: question, $options: 'i' } }, { aliases: { $in: [new RegExp(question, 'i')] } }],
        });

        return terms;
    } catch (error) {
        console.error('Error finding context terms:', error);
        return [];
    }
}

/**
 * RAG: Tìm kiếm sách trong database
 * 🆕 SỬ DỤNG HYBRID SEARCH (BM25 + Vector) - CHƯƠNG 3.3.2
 */
async function searchBooksRAG(question, categoryFilter = null) {
    try {
        console.log(`\n📚 RAG Search with Hybrid: "${question}"`);

        // 🆕 Use Hybrid Search (CHƯƠNG 4.3.3)
        const books = await hybridSearch(question, {
            limit: 10,
            bm25Weight: 0.4,
            vectorWeight: 0.6,
        });

        console.log(`🔍 DEBUG: Received ${books ? books.length : 'null'} books from hybridSearch`);
        if (books && books.length > 0) {
            console.log(`🔍 DEBUG: First book: ${books[0].title}`);
        }

        // Apply category filter if needed
        let filteredBooks = books;
        if (categoryFilter && books.length > 0) {
            const categories = await modelCategory
                .find({
                    nameCategory: { $regex: categoryFilter, $options: 'i' },
                })
                .select('_id')
                .lean();

            const categoryIds = categories.map((c) => c._id.toString());
            console.log(`🔍 Category filter: "${categoryFilter}" → Found ${categoryIds.length} matching categories`);

            const tempFilteredBooks = books.filter((book) => categoryIds.includes(book.category.toString()));
            console.log(`📚 Filtered to ${tempFilteredBooks.length} books in category`);

            // Only apply filter if it doesn't eliminate all results (avoid false negatives)
            if (tempFilteredBooks.length > 0) {
                filteredBooks = tempFilteredBooks;
            } else {
                console.log(`⚠️  Category filter eliminated all results - ignoring filter to avoid false negative`);
                filteredBooks = books; // Keep original hybrid search results
            }
        }

        console.log(`✅ Found ${filteredBooks.length} books via Hybrid Search`);

        return filteredBooks;
    } catch (error) {
        console.error('❌ RAG search error:', error);

        // Fallback to old BM25 method
        return searchBooksRAGLegacy(question, categoryFilter);
    }
}

/**
 * RAG: Tìm kiếm sách (Legacy BM25 method - fallback only)
 */
async function searchBooksRAGLegacy(question, categoryFilter = null) {
    try {
        const keywords = question
            .toLowerCase()
            .replace(/[?.,!]/g, '')
            .split(' ')
            .filter((w) => w.length > 2);

        // 🆕 If searching by category, find category first
        let categoryIds = [];
        if (categoryFilter) {
            const categories = await modelCategory
                .find({
                    nameCategory: { $regex: categoryFilter, $options: 'i' },
                })
                .select('_id')
                .lean();

            categoryIds = categories.map((c) => c._id);
            console.log(`🔍 Category filter: "${categoryFilter}" → Found ${categoryIds.length} matching categories`);
        }

        // Build query conditions
        const stockCondition = { availableCopies: { $gt: 0 } };
        const categoryCondition = categoryIds.length > 0 ? { category: { $in: categoryIds } } : {};

        // Strategy 1: MongoDB Text Search (nhanh nhất, dùng index)
        let books = await Book.find({
            $text: { $search: keywords.join(' ') },
            ...categoryCondition,
            ...stockCondition,
        })
            .select(
                'title author isbn dailyRentalFee availableCopies totalCopies location description publisher category borrowCount',
            )
            .sort({ score: { $meta: 'textScore' }, borrowCount: -1 })
            .limit(10)
            .lean();

        // Strategy 2: Fallback - Regex search nếu text search không có kết quả
        if (books.length === 0) {
            books = await Book.find({
                $and: [
                    {
                        $or: [
                            { title: { $regex: keywords.join('|'), $options: 'i' } },
                            { author: { $regex: keywords.join('|'), $options: 'i' } },
                            { keywords: { $in: keywords.map((k) => new RegExp(k, 'i')) } },
                        ],
                    },
                    categoryCondition,
                    stockCondition,
                ],
            })
                .select(
                    'title author isbn dailyRentalFee availableCopies totalCopies location description publisher category borrowCount',
                )
                .sort({ viewCount: -1, borrowCount: -1 })
                .limit(10)
                .lean();
        }

        // Strategy 3: If still no results and has category filter, get ALL books in that category
        if (books.length === 0 && categoryIds.length > 0) {
            books = await Book.find({
                category: { $in: categoryIds },
                ...stockCondition,
            })
                .select(
                    'title author isbn dailyRentalFee availableCopies totalCopies location description publisher category borrowCount',
                )
                .sort({ borrowCount: -1, viewCount: -1 })
                .limit(10)
                .lean();

            console.log(`📚 Fallback to all books in category: Found ${books.length} books`);
        }

        console.log(
            `📚 RAG Search (Legacy): Found ${books.length} books for query: "${question}"${
                categoryFilter ? ` (category: ${categoryFilter})` : ''
            }`,
        );

        return books;
    } catch (error) {
        console.error('Error searching books:', error);
        return [];
    }
}

/**
 * Kiểm tra escalation (chuyển sang support)
 */
function checkEscalation(question, policy) {
    if (!policy || !policy.rules.escalation.enabled) {
        return false;
    }

    const lowerQuestion = question.toLowerCase();

    // Danh sách từ khóa cho câu hỏi phức tạp cần can thiệp con người
    const complexKeywords = [
        'phức tạp',
        'khó hiểu',
        'không rõ',
        'không hiểu',
        'giải thích thêm',
        'cần hỗ trợ',
        'gặp vấn đề',
        'không thể',
        'lỗi',
        'sai',
        'khiếu nại',
        'phàn nàn',
        'không hài lòng',
        'hoàn tiền',
        'bồi thường',
        'tranh chấp',
        'khẩn cấp',
        'gấp',
        'quan trọng',
        'đặc biệt',
        'ngoại lệ',
    ];

    // Kiểm tra xem có từ khóa phức tạp không
    const hasComplexKeyword = complexKeywords.some((keyword) => lowerQuestion.includes(keyword));

    // Kiểm tra trigger từ policy
    const hasTrigger = policy.rules.escalation.triggers.some((trigger) =>
        lowerQuestion.includes(trigger.toLowerCase()),
    );

    return hasComplexKeyword || hasTrigger;
}

/**
 * Kiểm tra scope
 */
function checkScope(question, policy) {
    if (!policy || !policy.rules.scopeLimitation.enabled) {
        return true;
    }

    const lowerQuestion = question.toLowerCase();
    const allowedTopics = policy.rules.scopeLimitation.allowedTopics;

    return allowedTopics.some((topic) => lowerQuestion.includes(topic.toLowerCase()));
}

/**
 * Helper function: Sleep/delay
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper function: Retry với exponential backoff và fallback models
 */
async function retryWithBackoff(
    fn,
    maxRetries = 3,
    initialDelay = 1000,
    models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite'],
) {
    let lastError;
    let currentModelIndex = 0;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn(models[currentModelIndex]);
        } catch (error) {
            lastError = error;

            // Chỉ retry cho lỗi 503 (Service Unavailable) và 429 (Rate Limit)
            const shouldRetry =
                error.message.includes('503') ||
                error.message.includes('overloaded') ||
                error.message.includes('UNAVAILABLE') ||
                error.message.includes('429') ||
                error.message.includes('quá tải');

            if (!shouldRetry) {
                throw error; // Không retry nếu không phải lỗi quá tải
            }

            if (attempt === maxRetries - 1) {
                throw error; // Hết số lần thử
            }

            // Thử model khác nếu có
            if (attempt > 0 && currentModelIndex < models.length - 1) {
                currentModelIndex++;
                console.log(`🔄 Switching to fallback model: ${models[currentModelIndex]}`);
            }

            const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
            console.log(`⚠️  Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * Gọi Gemini AI với RAG và Policies
 */
async function askGeminiAI(question, context = '') {
    console.log('🎯 [askGeminiAI] START - Question:', question);

    try {
        const policy = await getActivePolicy();
        const apiKey = await getActiveApiKey();

        console.log(
            '🔍 DEBUG: policy =',
            policy
                ? {
                      name: policy.name,
                      isActive: policy.isActive,
                      scopeEnabled: policy.rules?.scopeLimitation?.enabled,
                      allowedTopics: policy.rules?.scopeLimitation?.allowedTopics,
                  }
                : 'NULL',
        );

        // 🔍 PARSE QUERY để detect intent
        const parsedQuery = parseQuery(question);
        console.log('🧠 Query Analysis:', parsedQuery);

        // 📚 XỬ LÝ LIST_CATEGORIES (liệt kê danh mục sách)
        if (parsedQuery.intent.type === 'LIST_CATEGORIES') {
            const categories = await modelCategory.find().select('nameCategory').lean();
            const bookCounts = await Promise.all(
                categories.map(async (cat) => {
                    const count = await Book.countDocuments({
                        category: cat._id,
                        availableCopies: { $gt: 0 },
                    });
                    return { ...cat, bookCount: count };
                }),
            );

            const totalBooks = await Book.countDocuments({
                availableCopies: { $gt: 0 },
            });

            const categoryList = bookCounts
                .filter((cat) => cat.bookCount > 0)
                .map((cat, i) => `${i + 1}. **${cat.nameCategory}**: ${cat.bookCount} cuốn`)
                .join('\n');

            const answer =
                `📚 **Thư viện hiện có ${
                    bookCounts.filter((c) => c.bookCount > 0).length
                } danh mục sách** với tổng cộng **${totalBooks} cuốn** đang sẵn sàng cho thuê:\n\n` +
                categoryList +
                '\n\n' +
                `💡 Bạn có thể hỏi chi tiết về từng danh mục, ví dụ:\n` +
                `• "Có những sách nào trong danh mục Kinh tế quốc tế?"\n` +
                `• "Tìm sách về Luật quốc tế"\n` +
                `• "Sách [tên sách] thuê bao nhiêu tiền 5 ngày?"`;

            console.log('📚 Category List Result:', bookCounts.length, 'categories');

            return {
                answer,
                source: 'categories',
                categories: bookCounts.filter((c) => c.bookCount > 0),
                totalBooks,
                directAnswer: true,
            };
        }

        // RAG: Tìm sách liên quan (dùng parsed category hoặc bookName)
        // NOTE: Do this BEFORE policy check to allow category searches
        const searchQuery = parsedQuery.bookName || question;
        const categoryFilter = parsedQuery.category || null;

        console.log('🔍 DEBUG: categoryFilter =', categoryFilter);
        console.log('🔍 DEBUG: searchQuery =', searchQuery);

        const relatedBooks = await searchBooksRAG(searchQuery, categoryFilter);
        const contextTerms = await findContextTerms(question);

        console.log('🔍 DEBUG: relatedBooks.length =', relatedBooks.length);
        console.log('🔍 DEBUG: intent.type =', parsedQuery.intent.type);

        // 📚 XỬ LÝ SEARCH BY CATEGORY (nếu detect category và có kết quả)
        // IMPORTANT: Run BEFORE policy check to allow category-based queries
        if (
            categoryFilter &&
            relatedBooks.length > 0 &&
            (parsedQuery.intent.type === 'SEARCH' || parsedQuery.intent.type === 'GENERAL')
        ) {
            console.log('📚 Category Search Result:', relatedBooks.length, 'books');

            const bookList = relatedBooks
                .map((book, i) => {
                    const bookTitle = book.title;
                    const author = book.author || 'Tác giả không rõ';
                    const dailyFee = book.dailyRentalFee.toLocaleString('vi-VN');
                    const qty = book.availableCopies || book.totalCopies || 0;
                    return `${i + 1}. **"${bookTitle}"** - ${author}\n   💰 ${dailyFee}đ/ngày | 📦 Còn ${qty} cuốn`;
                })
                .join('\n\n');

            const answer =
                `📚 Tìm thấy **${relatedBooks.length} cuốn sách** trong danh mục **"${categoryFilter}"**:\n\n` +
                bookList +
                '\n\n' +
                `💡 Bạn có thể:\n` +
                `• Hỏi chi tiết: "Cho tôi biết thêm về sách [tên sách]"\n` +
                `• Tính chi phí: "Sách [tên sách] thuê 5 ngày hết bao nhiêu tiền?"`;

            return {
                answer,
                source: 'category-search',
                relatedBooks,
                categoryFilter,
                directAnswer: true,
            };
        }

        // Kiểm tra escalation
        if (policy && checkEscalation(question, policy)) {
            const contactInfo = policy.rules.escalation.contactInfo;
            const message =
                `🤝 **Câu hỏi của bạn cần sự hỗ trợ từ Thủ thư**\n\n` +
                `Câu hỏi này có vẻ phức tạp hoặc cần can thiệp từ con người. Vui lòng liên hệ với quầy Thủ thư để được hỗ trợ tốt nhất:\n\n` +
                `📧 **Email:** ${contactInfo.email}\n` +
                `📞 **Hotline:** ${contactInfo.phone}\n` +
                `⏰ **Giờ làm việc:** 8:00 - 22:00 (Thứ 2 - Chủ nhật)\n\n` +
                `💡 Thủ thư của chúng tôi sẽ giúp bạn giải quyết các vấn đề như:\n` +
                `• Các trường hợp đặc biệt cần xử lý thủ công\n` +
                `• Giải quyết khiếu nại và tranh chấp\n` +
                `• Tư vấn chuyên sâu về sách và dịch vụ\n` +
                `• Hỗ trợ kỹ thuật và xử lý lỗi\n\n` +
                `Xin cảm ơn sự thông cảm của bạn! 🙏`;

            return {
                answer: message,
                source: 'escalation',
                escalated: true,
                contactInfo,
                needsHumanSupport: true,
            };
        }

        // Kiểm tra scope
        console.log('🔍 DEBUG: Checking policy scope...');
        console.log('   policy:', policy ? 'EXISTS' : 'NULL');
        if (policy) {
            console.log('   checkScope result:', checkScope(question, policy));
        }

        if (policy && !checkScope(question, policy)) {
            console.log('❌ REJECTED by policy scope check');
            return {
                answer: policy.rules.scopeLimitation.rejectionMessage,
                source: 'policy-rejection',
                rejected: true,
            };
        }

        // 🧮 XỬ LÝ TÍNH TOÁN (nếu detect calculation intent)
        let calculationResult = null;
        if (parsedQuery.needsCalculation && parsedQuery.duration && relatedBooks.length > 0) {
            // YÊU CẦU: Phải có tên sách rõ ràng (min 3 chars) để tránh nhầm lẫn
            if (!parsedQuery.bookName || parsedQuery.bookName.length < 3) {
                // Không đủ thông tin → yêu cầu user cung cấp tên sách
                return {
                    answer:
                        '❓ **Bạn muốn thuê sách nào?**\n\n' +
                        'Để tính chi phí chính xác, vui lòng cung cấp tên sách. Ví dụ:\n' +
                        '• "Sách [tên sách đầy đủ] thuê 5 ngày bao nhiêu tiền?"\n' +
                        '• "Tính tiền thuê [tên sách] trong 1 tuần"\n\n' +
                        '💡 Bạn có thể tìm sách trước bằng cách hỏi: "Tìm sách về [chủ đề]"',
                    source: 'missing-book-name',
                    needsMoreInfo: true,
                    relatedBooks: relatedBooks.slice(0, 5), // Gợi ý một số sách
                };
            }

            const book = relatedBooks[0]; // Lấy sách phù hợp nhất
            calculationResult = calculateRentalCost(book.price, parsedQuery.duration);

            console.log('💰 Calculation Result:', calculationResult);

            // Nếu có kết quả tính toán → trả lời trực tiếp không cần AI
            if (calculationResult) {
                const bookTitle = book.title;
                const answer =
                    `Sách "${bookTitle}" có giá thuê ${calculationResult.pricePerDay.toLocaleString(
                        'vi-VN',
                    )}đ/ngày.\n\n` +
                    `📊 Chi tiết tính toán:\n` +
                    `• Giá thuê: ${calculationResult.pricePerDay.toLocaleString('vi-VN')}đ/ngày\n` +
                    `• Thời gian: ${calculationResult.durationText}\n` +
                    `• Công thức: ${calculationResult.breakdown.formula}\n` +
                    `• 💵 Tổng tiền: ${calculationResult.breakdown.result}\n\n` +
                    `${book.availableCopies > 0 ? `📦 Còn ${book.availableCopies} cuốn có sẵn.` : '⚠️ Hiện đã hết.'}`;

                return {
                    answer,
                    source: 'calculation',
                    calculation: calculationResult,
                    relatedBooks: [book],
                    directAnswer: true,
                };
            }
        }

        // Build context từ RAG (Structured)
        let ragContext = '';
        if (relatedBooks.length > 0) {
            ragContext += '\n\n📚 SÁCH CÓ SẴN:\n';
            relatedBooks.forEach((book, index) => {
                const bookTitle = book.title || 'N/A';
                const availableCopies = book.availableCopies || 0;
                const status = availableCopies > 0 ? 'Có sẵn' : 'Đã mượn hết';
                ragContext += `${index + 1}. "${bookTitle}" - ${book.author || 'Tác giả không rõ'}\n`;
                ragContext += `   💰 ${book.dailyRentalFee.toLocaleString(
                    'vi-VN',
                )}đ/ngày | 📦 ${status}: ${availableCopies} cuốn`;
                if (book.location) ragContext += ` | 📍 ${book.location}`;
                if (book.isbn) ragContext += ` | ISBN: ${book.isbn}`;

                // Include book description (strip HTML tags for clean text)
                if (book.description) {
                    const cleanDescription = book.description
                        .replace(/<[^>]*>/g, '') // Remove HTML tags
                        .replace(/&[^;]+;/g, (entity) => {
                            // Decode HTML entities
                            const entities = {
                                '&aacute;': 'á',
                                '&Aacute;': 'Á',
                                '&agrave;': 'à',
                                '&Agrave;': 'À',
                                '&eacute;': 'é',
                                '&Eacute;': 'É',
                                '&egrave;': 'è',
                                '&Egrave;': 'È',
                                '&iacute;': 'í',
                                '&Iacute;': 'Í',
                                '&igrave;': 'ì',
                                '&Igrave;': 'Ì',
                                '&oacute;': 'ó',
                                '&Oacute;': 'Ó',
                                '&ograve;': 'ò',
                                '&Ograve;': 'Ò',
                                '&uacute;': 'ú',
                                '&Uacute;': 'Ú',
                                '&ugrave;': 'ù',
                                '&Ugrave;': 'Ù',
                                '&yacute;': 'ý',
                                '&Yacute;': 'Ý',
                                '&atilde;': 'ã',
                                '&Atilde;': 'Ã',
                                '&otilde;': 'õ',
                                '&Otilde;': 'Õ',
                                '&amp;': '&',
                                '&quot;': '"',
                                '&lt;': '<',
                                '&gt;': '>',
                                '&nbsp;': ' ',
                                '&ecirc;': 'ê',
                                '&Ecirc;': 'Ê',
                                '&acirc;': 'â',
                                '&Acirc;': 'Â',
                                '&ocirc;': 'ô',
                                '&Ocirc;': 'Ô',
                                '&ucirc;': 'û',
                                '&Ucirc;': 'Û',
                                '&ycirc;': 'ŷ',
                                '&Ycirc;': 'Ŷ',
                                '&aring;': 'å',
                                '&Aring;': 'Å',
                            };
                            return entities[entity] || entity;
                        })
                        .trim();

                    // Limit length to avoid token overflow
                    const maxLength = 800;
                    const truncatedDescription =
                        cleanDescription.length > maxLength
                            ? cleanDescription.substring(0, maxLength) + '...'
                            : cleanDescription;

                    ragContext += `\n   📝 Mô tả: ${truncatedDescription}\n`;
                }
                ragContext += '\n';
            });
        }

        if (contextTerms.length > 0) {
            ragContext += '\n\n📖 THUẬT NGỮ:\n';
            contextTerms.forEach((term) => {
                ragContext += `• ${term.term}: ${term.definition}\n`;
            });
        }

        // Build system prompt (Concise & Optimized)
        let systemPrompt = '';

        // Use Academic Librarian prompt when we have book content to cite
        if (relatedBooks.length > 0 && ragContext) {
            // STRICT CITATION PROMPT FOR ACADEMIC CONTENT
            systemPrompt = `BẠN LÀ MỘT TRỢ LÝ THƯ VIỆN HỌC THUẬT (Academic Librarian) TẠI HỌC VIỆN NGOẠI GIAO VIỆT NAM.
NHIỆM VỤ: Trả lời câu hỏi của sinh viên về NỘI DUNG SÁCH dựa HOÀN TOÀN trên [NGỮ CẢNH] được cung cấp.

✅ BẠN CÓ THỂ TRẢ LỜI:
- Câu hỏi về nội dung, điều khoản, quy định trong các sách/tài liệu có trong ngữ cảnh
- So sánh nội dung giữa các tài liệu khác nhau
- Giải thích các khái niệm từ sách trong thư viện
- Trích dẫn các điều luật, quy định từ văn bản pháp lý

📋 QUY TẮC TRÍCH DẪN BẮT BUỘC:
1. **CHỈ SỬ DỤNG THÔNG TIN TRONG [NGỮ CẢNH]**: Không được thêm kiến thức bên ngoài.
2. **TRÍCH DẪN CHÍNH XÁC**: Mỗi thông tin PHẢI có trích dẫn nguồn ngay sau:
   - Format: **(Nguồn: [Tên Tài Liệu Đầy Đủ] - [Vị Trí])**
   - Ví dụ: "(Nguồn: Công ước Liên Hợp Quốc về Luật Biển 1982 - Kệ 341.45 - Phòng đọc Luật)"
3. **NÊU RÕ ĐIỀU LUẬT**: Nếu trích dẫn Điều luật (Điều 57, Điều 15...), PHẢI ghi rõ số điều và trích nguyên văn.
4. **SO SÁNH RÕ RÀNG**: Khi so sánh 2 tài liệu, phân biệt rõ:
   - Tài liệu 1: [Tên] - [Nội dung] - (Nguồn: ...)
   - Tài liệu 2: [Tên] - [Nội dung] - (Nguồn: ...)
5. **KHÔNG TỰ BỊA**: Nếu không có trong ngữ cảnh → "Xin lỗi, thư viện chưa cập nhật thông tin này."
6. **ĐỊNH DẠNG RÕ RÀNG**: Dùng bullet points, in đậm tên tài liệu để dễ đọc.
7. **TRẢ LỜI NGẮN GỌN**: Đi thẳng vào vấn đề, không chào hỏi dài dòng.

[NGỮ CẢNH - SÁCH VÀ TÀI LIỆU CÓ SẴN]:
${context}${ragContext ? '\n' + ragContext : '\n⚠️ Không có dữ liệu ngữ cảnh'}

[CÂU HỎI CỦA SINH VIÊN]:
${question}

[TRẢ LỜI CỦA THƯ VIỆN VIÊN - BẮT BUỘC CÓ TRÍCH DẪN NGUỒN]:`;
        } else if (policy && policy.systemPrompt) {
            // Use policy's system prompt for general library queries
            systemPrompt = policy.systemPrompt + '\n\n' + (context || '') + (ragContext || '');
        } else {
            // Fallback: Simple prompt
            systemPrompt = `Bạn là trợ lý thư viện. Hỗ trợ người dùng tìm sách và thông tin.\n\n${context}${ragContext}\n\nCâu hỏi: ${question}`;
        }

        // Kiểm tra API key
        if (!apiKey) {
            throw new Error('API key không được cấu hình. Vui lòng kiểm tra file .env');
        }

        // Wrapper function cho retry logic với fallback models
        const makeApiCall = async (modelName = 'gemini-2.5-flash') => {
            const API_URL = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

            // Thêm timeout controller
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 giây timeout

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: systemPrompt,
                                    },
                                ],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.1, // Giảm xuống 0.1: bám sát context 100%, gần như không sáng tạo
                            topK: 10, // Giảm xuống 10: chỉ lấy top tokens có xác suất cao nhất
                            topP: 0.75, // Giảm xuống 0.75: tập trung mạnh vào tokens chính xác
                            maxOutputTokens: 1200, // Tăng lên 1200 cho câu trả lời chi tiết với trích dẫn
                            candidateCount: 1, // Chỉ tạo 1 candidate
                            stopSequences: ['\n\n\n', '---', '[END]'], // Dừng sớm nếu gặp dấu hiệu kết thúc
                        },
                        safetySettings: [
                            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                        ],
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Gemini API Error:', {
                        model: modelName,
                        status: response.status,
                        statusText: response.statusText,
                        error: errorData,
                    });

                    if (apiKey !== process.env.GEMINI_API_KEY) {
                        await modelApiKeyConfig.findOneAndUpdate(
                            { isActive: true, provider: 'gemini' },
                            { $inc: { 'usageStats.failedRequests': 1 } },
                        );
                    }

                    // Xử lý các loại lỗi cụ thể
                    if (response.status === 400) {
                        throw new Error('Yêu cầu không hợp lệ. Vui lòng thử lại.');
                    } else if (response.status === 401 || response.status === 403) {
                        throw new Error('API key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.');
                    } else if (response.status === 429) {
                        throw new Error('429: Đã vượt quá giới hạn request. Vui lòng thử lại sau.');
                    } else if (response.status === 503) {
                        throw new Error('503: Dịch vụ AI đang quá tải. Đang thử lại...');
                    } else if (response.status === 500) {
                        throw new Error('Dịch vụ AI đang bảo trì. Vui lòng thử lại sau.');
                    }

                    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
                }

                const data = await response.json();

                // Kiểm tra response data
                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    throw new Error('Không nhận được phản hồi hợp lệ từ AI');
                }

                const text = data.candidates[0].content.parts[0].text;

                if (apiKey !== process.env.GEMINI_API_KEY) {
                    await modelApiKeyConfig.findOneAndUpdate(
                        { isActive: true, provider: 'gemini' },
                        { $inc: { 'usageStats.successfulRequests': 1 } },
                    );
                }

                return {
                    answer: text,
                    source: 'gemini-ai',
                    model: modelName,
                    relatedBooks: relatedBooks.map((b) => ({
                        _id: b._id,
                        title: b.title,
                        author: b.author,
                        dailyRentalFee: b.dailyRentalFee,
                        availableCopies: b.availableCopies,
                        images: b.images,
                        isbn: b.isbn,
                    })),
                    bookIds: relatedBooks.map((b) => b._id.toString()), // Thêm bookIds cho frontend
                    bookCount: relatedBooks.length, // Tổng số sách tìm thấy
                    contextTerms: contextTerms.map((t) => ({
                        term: t.term,
                        definition: t.definition,
                    })),
                };
            } catch (fetchError) {
                clearTimeout(timeoutId);

                // Xử lý lỗi timeout
                if (fetchError.name === 'AbortError') {
                    console.error('Request timeout after 30 seconds');
                    throw new Error('Yêu cầu quá lâu. Vui lòng thử lại.');
                }

                // Xử lý lỗi kết nối mạng
                if (fetchError.message.includes('fetch failed') || fetchError.code === 'ECONNREFUSED') {
                    console.error('Network connection error:', fetchError);
                    throw new Error('Không thể kết nối mạng. Vui lòng kiểm tra internet.');
                }

                throw fetchError;
            }
        };

        // Thực hiện API call với retry mechanism và fallback models
        return await retryWithBackoff(makeApiCall, 4, 2000, [
            'gemini-2.5-flash',
            'gemini-2.5-flash-lite',
            'gemini-2.0-flash-lite',
        ]); // 4 lần thử, delay bắt đầu từ 2 giây, fallback qua 3 models
    } catch (error) {
        console.error('Error calling Gemini AI:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
        });

        // Nếu error đã có message cụ thể, throw lại
        if (error.message && !error.message.includes('Error calling Gemini AI')) {
            throw error;
        }

        // Lỗi chung
        throw new Error('Không thể kết nối với AI. Vui lòng thử lại sau.');
    }
}

module.exports = { askGeminiAI, getActiveApiKey, getActivePolicy };
