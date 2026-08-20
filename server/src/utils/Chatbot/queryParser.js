/**
 * Query Parser: Phân tích intent và trích xuất thông tin từ câu hỏi
 */

/**
 * Detect query intent
 */
function detectIntent(question) {
    const lowerQ = question.toLowerCase();

    // Intent: LIST_CATEGORIES (liệt kê danh mục sách)
    const listCategoryPatterns = [
        /thư viện có (những )?sách (gì|nào)/i,
        /có (những )?sách (gì|nào)(?! về)/i, // Match "có những sách gì" but NOT "có những sách gì về X" (category search)
        /có (những )?loại sách (gì|nào)/i,
        /danh mục sách/i,
        /các thể loại sách/i,
        /sách (gì|nào) trong thư viện/i,
        /cho (tôi |mình )?biết (có )?những sách (gì|nào)/i,
    ];

    if (listCategoryPatterns.some((pattern) => pattern.test(question))) {
        return {
            type: 'LIST_CATEGORIES',
            confidence: 0.95,
        };
    }

    // Intent: CALCULATE (tính toán)
    const calculateKeywords = [
        'bao nhiêu tiền',
        'tổng tiền',
        'giá',
        'chi phí',
        'tốn',
        'mất',
        'thuê',
        'ngày',
        'tuần',
        'tháng',
        'hết',
        'phải trả',
    ];

    const hasCalculate = calculateKeywords.some((kw) => lowerQ.includes(kw));
    const hasDuration = /\d+\s*(ngày|tuần|tháng)/i.test(question);

    if (hasCalculate && hasDuration) {
        return {
            type: 'CALCULATE',
            confidence: 0.9,
        };
    }

    // Intent: SEARCH (tìm sách)
    const searchKeywords = ['tìm', 'có', 'sách nào', 'cho tôi', 'muốn', 'cần'];
    if (searchKeywords.some((kw) => lowerQ.includes(kw))) {
        return {
            type: 'SEARCH',
            confidence: 0.8,
        };
    }

    // Intent: INFO (thông tin)
    const infoKeywords = ['là gì', 'thế nào', 'như thế nào', 'cách', 'thủ tục'];
    if (infoKeywords.some((kw) => lowerQ.includes(kw))) {
        return {
            type: 'INFO',
            confidence: 0.7,
        };
    }

    return {
        type: 'GENERAL',
        confidence: 0.5,
    };
}

/**
 * Extract duration từ câu hỏi
 */
function extractDuration(question) {
    // Pattern: "5 ngày", "2 tuần", "1 tháng"
    const dayMatch = question.match(/(\d+)\s*ngày/i);
    if (dayMatch) {
        return {
            value: parseInt(dayMatch[1]),
            unit: 'ngày',
            days: parseInt(dayMatch[1]),
        };
    }

    const weekMatch = question.match(/(\d+)\s*tuần/i);
    if (weekMatch) {
        return {
            value: parseInt(weekMatch[1]),
            unit: 'tuần',
            days: parseInt(weekMatch[1]) * 7,
        };
    }

    const monthMatch = question.match(/(\d+)\s*tháng/i);
    if (monthMatch) {
        return {
            value: parseInt(monthMatch[1]),
            unit: 'tháng',
            days: parseInt(monthMatch[1]) * 30,
        };
    }

    return null;
}

/**
 * Extract category từ câu hỏi (nếu user hỏi về danh mục)
 */
function extractCategory(question) {
    const lowerQ = question.toLowerCase();

    // Danh sách categories cố định (hardcoded để match chính xác)
    const knownCategories = [
        'Quan hệ quốc tế',
        'Luật quốc tế',
        'Kinh tế quốc tế',
        'Truyền thông văn hóa',
        'Tiếng Anh',
        'Tiếng Trung',
        'Tiếng Pháp',
        'Sách tham khảo',
        'Sách ngoại văn',
    ];

    // Check if query contains any known category name
    for (const category of knownCategories) {
        if (lowerQ.includes(category.toLowerCase())) {
            return category;
        }
    }

    // Patterns: "tìm sách về X", "sách X", "danh mục X"
    const categoryPatterns = [
        /(?:tìm|có|cho|xem)\s+(?:sách|những sách|cuốn sách)?\s+(?:về|trong|thuộc|của)?\s*(?:danh mục)?\s+(.+?)(?:\s+nào|\s+gì|$)/i,
        /(?:sách|những sách)\s+(?:về|trong|thuộc|của)\s+(?:danh mục)?\s+(.+?)(?:\s+nào|\s+gì|$)/i,
        /danh mục\s+(.+?)(?:\s+có|$)/i,
    ];

    for (const pattern of categoryPatterns) {
        const match = question.match(pattern);
        if (match && match[1]) {
            const category = match[1].trim();
            // Filter out common words
            const filtered = category.replace(/\b(sách|nào|gì|có|những|các|cho|tôi|xem)\b/gi, '').trim();
            if (filtered.length > 2) {
                // Capitalize first letter
                return filtered
                    .split(' ')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ');
            }
        }
    }

    return null;
}

/**
 * Extract book name từ câu hỏi (fuzzy)
 */
function extractBookName(question) {
    // Remove common words
    const stopWords = [
        'sách',
        'cuốn',
        'quyển',
        'tìm',
        'cho',
        'tôi',
        'mình',
        'muốn',
        'thuê',
        'mượn',
        'bao',
        'nhiêu',
        'tiền',
        'ngày',
        'tuần',
        'tháng',
        'hết',
        'tổng',
        'phải',
        'trả',
        'là',
        'của',
        'về',
        'có',
        'không',
    ];

    let words = question
        .toLowerCase()
        .replace(/[?.,!]/g, '')
        .split(/\s+/)
        .filter((w) => !stopWords.includes(w) && w.length > 1);

    // Remove numbers and duration
    words = words.filter((w) => !/^\d+$/.test(w));

    return words.join(' ').trim();
}

/**
 * Calculate rental cost
 */
function calculateRentalCost(pricePerDay, duration) {
    if (!pricePerDay || !duration || !duration.days) {
        return null;
    }

    const total = pricePerDay * duration.days;

    return {
        pricePerDay,
        duration: duration.days,
        durationText: `${duration.value} ${duration.unit}`,
        total,
        breakdown: {
            formula: `${pricePerDay.toLocaleString('vi-VN')}đ × ${duration.days} ngày`,
            result: `${total.toLocaleString('vi-VN')}đ`,
        },
    };
}

/**
 * Parse full query
 */
function parseQuery(question) {
    const intent = detectIntent(question);
    const duration = extractDuration(question);
    const bookName = extractBookName(question);
    const category = extractCategory(question);

    return {
        originalQuestion: question,
        intent,
        duration,
        bookName,
        category, // NEW: extracted category name
        needsCalculation: intent.type === 'CALCULATE' && duration !== null,
        searchKeywords: bookName ? bookName.split(' ').filter((w) => w.length > 2) : [],
    };
}

module.exports = {
    detectIntent,
    extractDuration,
    extractBookName,
    extractCategory, // Export new function
    calculateRentalCost,
    parseQuery,
};
