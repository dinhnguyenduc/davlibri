/**
 * ERROR ANALYSIS - CHƯƠNG 5.2.3
 * ==============================
 * Phân tích các trường hợp chatbot trả lời SAI
 * Xác định nguyên nhân: Multi-hop reasoning, Missing context, etc.
 *
 * Output: error-analysis.json với các failure cases
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const FAQ = require('../src/models/faq.model');
const goldenDataset = require('./golden_dataset_enhanced.json');

// Configuration
const CONFIG = {
    similarityThreshold: 0.3,
    keywordThreshold: 0.5,
};

// Error categories
const ERROR_CATEGORIES = {
    NOT_FOUND: 'Không tìm thấy trong database',
    LOW_SIMILARITY: 'Tìm thấy nhưng độ tương đồng thấp',
    WRONG_ANSWER: 'Trả lời sai hoàn toàn',
    MULTI_HOP: 'Yêu cầu suy luận nhiều bước',
    MISSING_CONTEXT: 'Thiếu ngữ cảnh cần thiết',
    AMBIGUOUS: 'Câu hỏi mơ hồ, đa nghĩa',
};

// Results
const analysis = {
    timestamp: new Date().toISOString(),
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    errorsByCategory: {},
    detailedErrors: [],
    recommendations: [],
};

/**
 * Calculate similarity
 */
function calculateSimilarity(str1, str2) {
    const s1 = (str1 || '').toLowerCase().trim();
    const s2 = (str2 || '').toLowerCase().trim();

    if (s1 === s2) return 1;
    if (!s1 || !s2) return 0;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function getEditDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

/**
 * Check keyword match
 */
function keywordsMatch(text, keywords) {
    const lowerText = text.toLowerCase();
    const matchCount = keywords.filter((kw) => lowerText.includes(kw.toLowerCase())).length;
    return matchCount / keywords.length;
}

/**
 * Detect multi-hop reasoning requirement
 */
function requiresMultiHop(question) {
    const multiHopIndicators = [
        'sau đó',
        'tiếp theo',
        'nếu.*thì',
        'trường hợp.*và',
        'kết hợp',
        'so sánh',
        'khác biệt giữa',
    ];

    return multiHopIndicators.some((pattern) => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(question);
    });
}

/**
 * Detect ambiguous questions
 */
function isAmbiguous(question) {
    const ambiguousIndicators = ['nó', 'đó', 'này', 'kia', 'thế', 'vậy'];

    // Count pronouns without clear antecedents
    const pronounCount = ambiguousIndicators.filter((word) => question.toLowerCase().includes(word)).length;

    return pronounCount > 2;
}

/**
 * Categorize error
 */
function categorizeError(item, faqs, bestMatch) {
    if (faqs.length === 0) {
        return {
            category: ERROR_CATEGORIES.NOT_FOUND,
            reason: 'Không có FAQ nào được tìm thấy trong database',
            severity: 'HIGH',
        };
    }

    if (!bestMatch.found) {
        if (requiresMultiHop(item.question)) {
            return {
                category: ERROR_CATEGORIES.MULTI_HOP,
                reason: 'Câu hỏi yêu cầu suy luận logic qua nhiều bước hoặc kết hợp nhiều nguồn thông tin',
                severity: 'MEDIUM',
            };
        }

        if (isAmbiguous(item.question)) {
            return {
                category: ERROR_CATEGORIES.AMBIGUOUS,
                reason: 'Câu hỏi mơ hồ, thiếu ngữ cảnh rõ ràng',
                severity: 'LOW',
            };
        }

        return {
            category: ERROR_CATEGORIES.LOW_SIMILARITY,
            reason: `Tìm thấy ${faqs.length} FAQs nhưng độ tương đồng < ${CONFIG.similarityThreshold}`,
            severity: 'MEDIUM',
        };
    }

    return {
        category: ERROR_CATEGORIES.MISSING_CONTEXT,
        reason: 'FAQ có nhưng thiếu thông tin cần thiết',
        severity: 'LOW',
    };
}

/**
 * Test single question
 */
async function testQuestion(item) {
    try {
        // Search FAQs
        const faqs = await FAQ.find({
            isActive: true,
            $text: { $search: item.question },
        })
            .select('question answer keywords source_ref')
            .limit(5);

        if (faqs.length === 0) {
            return {
                found: false,
                score: 0,
                faqs: [],
            };
        }

        // Find best match
        let bestScore = 0;
        let bestMatch = null;

        for (const faq of faqs) {
            const similarity = calculateSimilarity(faq.answer, item.golden_answer);
            const keywordMatch = item.keywords ? keywordsMatch(faq.answer, item.keywords) : 0;

            const score = Math.max(similarity, keywordMatch);

            if (score > bestScore) {
                bestScore = score;
                bestMatch = faq;
            }
        }

        const found = bestScore > CONFIG.similarityThreshold;

        return {
            found,
            score: bestScore,
            faqs,
            bestMatch,
        };
    } catch (error) {
        return {
            found: false,
            score: 0,
            error: error.message,
            faqs: [],
        };
    }
}

/**
 * Run error analysis
 */
async function runErrorAnalysis() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║        ERROR ANALYSIS - CHƯƠNG 5.2.3                      ║');
    console.log('║        Phân Tích Các Trường Hợp Sai                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Connect to MongoDB
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected\n');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }

    analysis.totalQuestions = goldenDataset.length;

    console.log('📊 Configuration:');
    console.log(`   Total questions: ${analysis.totalQuestions}`);
    console.log(`   Similarity threshold: ${CONFIG.similarityThreshold}`);
    console.log(`   Keyword threshold: ${CONFIG.keywordThreshold}\n`);

    console.log('━'.repeat(60));
    console.log('🔍 ANALYZING ERRORS');
    console.log('━'.repeat(60));

    // Initialize error counters
    Object.values(ERROR_CATEGORIES).forEach((category) => {
        analysis.errorsByCategory[category] = {
            count: 0,
            examples: [],
        };
    });

    for (let i = 0; i < goldenDataset.length; i++) {
        const item = goldenDataset[i];

        process.stdout.write(`[${i + 1}/${goldenDataset.length}] Testing: "${item.question.substring(0, 40)}..."\r`);

        const result = await testQuestion(item);

        if (result.found) {
            analysis.correctAnswers++;
        } else {
            analysis.incorrectAnswers++;

            // Categorize error
            const errorInfo = categorizeError(item, result.faqs, result);

            // Store error
            const errorDetail = {
                id: item.id,
                category: item.category,
                question: item.question,
                expectedAnswer: item.golden_answer,
                actualAnswer: result.bestMatch ? result.bestMatch.answer : 'N/A',
                errorCategory: errorInfo.category,
                reason: errorInfo.reason,
                severity: errorInfo.severity,
                score: result.score,
                keywords: item.keywords,
                topic: item.topic,
                complexity: item.complexity,
            };

            analysis.detailedErrors.push(errorDetail);

            // Add to category
            if (analysis.errorsByCategory[errorInfo.category].examples.length < 3) {
                analysis.errorsByCategory[errorInfo.category].examples.push({
                    question: item.question,
                    reason: errorInfo.reason,
                });
            }
            analysis.errorsByCategory[errorInfo.category].count++;
        }

        await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log('\n');

    // Calculate accuracy
    const accuracy = (analysis.correctAnswers / analysis.totalQuestions) * 100;

    console.log('━'.repeat(60));
    console.log('📊 ERROR ANALYSIS RESULTS');
    console.log('━'.repeat(60));
    console.log(`\n✅ Overall:`);
    console.log(`   Correct: ${analysis.correctAnswers}/${analysis.totalQuestions} (${accuracy.toFixed(1)}%)`);
    console.log(
        `   Incorrect: ${analysis.incorrectAnswers}/${analysis.totalQuestions} (${(100 - accuracy).toFixed(1)}%)`,
    );
    console.log();

    console.log(`❌ Errors by Category:`);
    const sortedErrors = Object.entries(analysis.errorsByCategory).sort((a, b) => b[1].count - a[1].count);

    sortedErrors.forEach(([category, data]) => {
        if (data.count > 0) {
            const percentage = ((data.count / analysis.incorrectAnswers) * 100).toFixed(1);
            console.log(`   ${category}:`);
            console.log(`      Count: ${data.count} (${percentage}%)`);
            if (data.examples.length > 0) {
                console.log(`      Example: "${data.examples[0].question.substring(0, 60)}..."`);
            }
        }
    });
    console.log();

    // Generate recommendations
    generateRecommendations();

    console.log(`💡 Recommendations:`);
    analysis.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
    });

    console.log('\n━'.repeat(60));

    // Export results
    await exportResults();

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    console.log('✨ Error analysis completed!\n');
}

/**
 * Generate recommendations based on errors
 */
function generateRecommendations() {
    const notFoundCount = analysis.errorsByCategory[ERROR_CATEGORIES.NOT_FOUND].count;
    const multiHopCount = analysis.errorsByCategory[ERROR_CATEGORIES.MULTI_HOP].count;
    const lowSimCount = analysis.errorsByCategory[ERROR_CATEGORIES.LOW_SIMILARITY].count;

    if (notFoundCount > 10) {
        analysis.recommendations.push(`Thêm ${notFoundCount} FAQs mới vào database để cover các câu hỏi chưa có`);
    }

    if (multiHopCount > 5) {
        analysis.recommendations.push(
            `Cải thiện RAG pipeline để xử lý câu hỏi multi-hop reasoning (${multiHopCount} cases)`,
        );
    }

    if (lowSimCount > 8) {
        analysis.recommendations.push(
            `Cải thiện text search index hoặc giảm similarity threshold (${lowSimCount} cases gần đúng)`,
        );
    }

    if (analysis.incorrectAnswers < 10) {
        analysis.recommendations.push('✅ Hệ thống hoạt động tốt, chỉ cần fine-tuning nhỏ');
    }
}

/**
 * Export results
 */
async function exportResults() {
    const outputDir = path.join(__dirname, '../benchmark-results');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Export JSON
    const jsonPath = path.join(outputDir, 'error-analysis.json');
    fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2), 'utf8');
    console.log(`\n📄 Results exported: ${jsonPath}`);

    // Export CSV
    const csvPath = path.join(outputDir, 'error-summary.csv');
    const csvContent = `Error Category,Count,Percentage
${Object.entries(analysis.errorsByCategory)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([cat, data]) => {
        const pct = analysis.incorrectAnswers > 0 ? ((data.count / analysis.incorrectAnswers) * 100).toFixed(1) : 0;
        return `${cat},${data.count},${pct}%`;
    })
    .join('\n')}

Summary
Metric,Value
Total Questions,${analysis.totalQuestions}
Correct,${analysis.correctAnswers}
Incorrect,${analysis.incorrectAnswers}
Accuracy,${((analysis.correctAnswers / analysis.totalQuestions) * 100).toFixed(1)}%
`;

    fs.writeFileSync(csvPath, csvContent, 'utf8');
    console.log(`📄 Summary CSV: ${csvPath}`);
}

/**
 * Run the analysis
 */
runErrorAnalysis().catch((error) => {
    console.error('\n❌ Error analysis failed:', error);
    process.exit(1);
});
