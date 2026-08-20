const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const colors = require('colors');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Models & Services
const Book = require('../src/models/books.model');
const HybridSearchService = require('../src/services/HybridSearchService');
const goldenDataset = require('./golden_dataset.json');

/**
 * ⚠️ NOTE: This script needs to be updated to work with the new dataset format.
 *
 * NEW DATASET FORMAT (golden_dataset.json):
 * - Simple array of 100 questions: [{id, domain, question, answer}, ...]
 * - All questions are DAV-specialized (no category field)
 * - Domains: Quy chế Học viện, Chính trị - Đối ngoại, Luật pháp Quốc tế,
 *   Quan hệ Quốc tế, Quy chế đặc thù, Lịch sử & Truyền thống DAV
 *
 * REQUIRED CHANGES:
 * 1. Replace goldenDataset.dataset with goldenDataset (it's now an array)
 * 2. Replace item.category with item.domain
 * 3. Update filtering logic - no more separate categories like "search_queries", "chatbot_questions"
 * 4. All questions should be evaluated together or grouped by domain
 *
 * CURRENT STATUS: This script will NOT work without updates.
 * Use simple-evaluate.js for basic validation instead.
 */

// Configuration
const EVALUATION_CONFIG = {
    precision_k: [5, 10, 20],
    relevance_threshold: 0.5,
    timeout: 30000,
};

// Evaluation metrics
let evaluation = {
    timestamp: new Date().toISOString(),
    totalQuestions: 0,
    categoryBreakdown: {},
    metrics: {
        precision: {},
        recall: {},
        f1Score: {},
        mrr: 0, // Mean Reciprocal Rank
        map: 0, // Mean Average Precision
        ndcg: 0, // Normalized Discounted Cumulative Gain
    },
    results: [],
    errors: [],
};

// Helper functions
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const calculateSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;
    if (!s1 || !s2) return 0;

    // Levenshtein distance variant for similarity
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1;

    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
};

const getEditDistance = (s1, s2) => {
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
};

const isRelevant = (book, expectedBooks) => {
    if (!expectedBooks || expectedBooks.length === 0) return false;

    const similarity = expectedBooks.some((expected) => {
        const titleSim = calculateSimilarity(book.title, expected);
        return titleSim >= EVALUATION_CONFIG.relevance_threshold;
    });

    return similarity;
};

const calculateDCG = (rankings) => {
    let dcg = 0;
    rankings.forEach((isRelevant, index) => {
        if (isRelevant) {
            dcg += 1 / Math.log2(index + 2); // index+2 because positions are 1-indexed
        }
    });
    return dcg;
};

const calculateIDCG = (relevantCount, k) => {
    let idcg = 0;
    for (let i = 0; i < Math.min(relevantCount, k); i++) {
        idcg += 1 / Math.log2(i + 2);
    }
    return idcg;
};

// Evaluate search queries
async function evaluateSearchQueries() {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 EVALUATING SEARCH QUERIES');
    console.log('='.repeat(70));

    const searchQueries = goldenDataset.dataset.filter((item) => item.category === 'search_queries');
    let precisionAtK = { 5: [], 10: [], 20: [] };
    let mrr = 0;
    let mrrCount = 0;

    for (let i = 0; i < searchQueries.length; i++) {
        const testCase = searchQueries[i];
        console.log(`\n[${i + 1}/${searchQueries.length}] Query: "${testCase.question}"`);

        try {
            const startTime = performance.now();

            const results = await Promise.race([
                HybridSearchService.searchWithFacets(testCase.question, { limit: 20 }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Query timeout')), EVALUATION_CONFIG.timeout),
                ),
            ]);

            const latency = performance.now() - startTime;
            const retrievedBooks = results.data || [];

            // Verify minimum results requirement
            const meetsMinimum = retrievedBooks.length >= testCase.min_expected_results;
            console.log(
                `  Results: ${retrievedBooks.length} (min required: ${testCase.min_expected_results}) ${meetsMinimum ? '✓' : '✗'}`,
            );

            // Calculate relevance
            const relevanceScores = retrievedBooks.map((book) => isRelevant(book, testCase.expected_books));

            // Calculate MRR (Mean Reciprocal Rank)
            const firstRelevantRank = relevanceScores.findIndex((rel) => rel) + 1;
            if (firstRelevantRank > 0) {
                mrr += 1 / firstRelevantRank;
                mrrCount++;
            }

            // Calculate Precision@K
            for (const k of EVALUATION_CONFIG.precision_k) {
                const topK = relevanceScores.slice(0, k);
                const relevantInK = topK.filter((rel) => rel).length;
                const precision = k > 0 ? relevantInK / k : 0;
                precisionAtK[k].push(precision);
            }

            // Log details
            console.log(`  Latency: ${latency.toFixed(2)}ms`);
            console.log(`  Relevant results: ${relevanceScores.filter((r) => r).length}/${retrievedBooks.length}`);

            evaluation.results.push({
                type: 'search',
                question: testCase.question,
                retrieved: retrievedBooks.length,
                relevantFound: relevanceScores.filter((r) => r).length,
                latency: latency,
                passed: meetsMinimum,
            });
        } catch (error) {
            console.log(`  ✗ Error: ${error.message}`);
            evaluation.errors.push({
                type: 'search',
                question: testCase.question,
                error: error.message,
            });

            evaluation.results.push({
                type: 'search',
                question: testCase.question,
                retrieved: 0,
                relevantFound: 0,
                latency: 0,
                passed: false,
            });
        }
    }

    // Calculate averages
    for (const k of EVALUATION_CONFIG.precision_k) {
        evaluation.metrics.precision[`@${k}`] =
            precisionAtK[k].length > 0 ? precisionAtK[k].reduce((a, b) => a + b, 0) / precisionAtK[k].length : 0;
    }

    evaluation.metrics.mrr = mrrCount > 0 ? mrr / mrrCount : 0;

    console.log(`\n📊 Search Query Results:`);
    console.log(`  Precision@5: ${(evaluation.metrics.precision['@5'] * 100).toFixed(2)}%`);
    console.log(`  Precision@10: ${(evaluation.metrics.precision['@10'] * 100).toFixed(2)}%`);
    console.log(`  Precision@20: ${(evaluation.metrics.precision['@20'] * 100).toFixed(2)}%`);
    console.log(`  Mean Reciprocal Rank (MRR): ${evaluation.metrics.mrr.toFixed(4)}`);
}

// Evaluate chatbot questions
async function evaluateChatbotQuestions() {
    console.log('\n' + '='.repeat(70));
    console.log('💬 EVALUATING CHATBOT QUESTIONS');
    console.log('='.repeat(70));

    const chatbotQuestions = goldenDataset.dataset.filter((item) => item.category === 'chatbot_questions');
    let answerQuality = [];
    let citationAccuracy = [];
    const client = require('../config/geminiConfig');

    for (let i = 0; i < chatbotQuestions.length; i++) {
        const testCase = chatbotQuestions[i];
        console.log(`\n[${i + 1}/${chatbotQuestions.length}] Question: "${testCase.question}"`);

        try {
            const startTime = performance.now();

            // Retrieve context
            const searchResults = await HybridSearchService.searchWithFacets(testCase.question, { limit: 5 });
            const context =
                searchResults.data
                    ?.slice(0, 5)
                    .map((book) => `- "${book.title}" by ${book.author}`)
                    .join('\n') || 'No relevant books found';

            const systemPrompt = `You are a helpful library assistant. Based on the following available books, answer the user's question.

Available books:
${context}

Guidelines:
- Recommend relevant books from the available collection
- Explain concepts clearly
- Be educational and helpful`;

            const response = await Promise.race([
                client.generateContent({
                    contents: [{ role: 'user', parts: [{ text: testCase.question }] }],
                    systemInstruction: systemPrompt,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Chatbot timeout')), EVALUATION_CONFIG.timeout),
                ),
            ]);

            const latency = performance.now() - startTime;
            const responseText = response.response.text();

            // Evaluate response quality
            let qualityScore = 0;
            let citationScore = 0;

            // Check if answer contains expected information
            if (testCase.expected_answer_includes && testCase.expected_answer_includes.length > 0) {
                const matchedInclusions = testCase.expected_answer_includes.filter((inclusion) =>
                    responseText.toLowerCase().includes(inclusion.toLowerCase()),
                );
                qualityScore = matchedInclusions.length / testCase.expected_answer_includes.length;
            } else {
                qualityScore = responseText.length > 50 ? 1 : 0.5;
            }

            // Check citation accuracy
            if (testCase.should_cite_books) {
                const citePatterns = [/"[^"]+"/g, /«[^»]+»/g, /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g];
                const citations = new Set();
                for (const pattern of citePatterns) {
                    const matches = responseText.match(pattern) || [];
                    matches.forEach((m) => citations.add(m));
                }
                citationScore = citations.size > 0 ? 1 : 0.5;
            } else {
                citationScore = 1; // Not expected to cite
            }

            answerQuality.push(qualityScore);
            citationAccuracy.push(citationScore);

            console.log(`  ✓ Latency: ${latency.toFixed(2)}ms`);
            console.log(`  Quality Score: ${(qualityScore * 100).toFixed(0)}%`);
            console.log(`  Citation Score: ${(citationScore * 100).toFixed(0)}%`);
            console.log(`  Response: "${responseText.substring(0, 80)}..."`);

            evaluation.results.push({
                type: 'chatbot',
                question: testCase.question,
                qualityScore: qualityScore,
                citationScore: citationScore,
                latency: latency,
                responseLength: responseText.length,
                passed: qualityScore >= 0.7 && citationScore >= 0.7,
            });
        } catch (error) {
            console.log(`  ✗ Error: ${error.message}`);
            evaluation.errors.push({
                type: 'chatbot',
                question: testCase.question,
                error: error.message,
            });

            evaluation.results.push({
                type: 'chatbot',
                question: testCase.question,
                qualityScore: 0,
                citationScore: 0,
                latency: 0,
                responseLength: 0,
                passed: false,
            });
        }
    }

    const avgQuality = answerQuality.length > 0 ? answerQuality.reduce((a, b) => a + b, 0) / answerQuality.length : 0;
    const avgCitation =
        citationAccuracy.length > 0 ? citationAccuracy.reduce((a, b) => a + b, 0) / citationAccuracy.length : 0;

    console.log(`\n📊 Chatbot Results:`);
    console.log(`  Average Quality Score: ${(avgQuality * 100).toFixed(2)}%`);
    console.log(`  Average Citation Accuracy: ${(avgCitation * 100).toFixed(2)}%`);
    console.log(`  Overall Chatbot Accuracy: ${(((avgQuality + avgCitation) / 2) * 100).toFixed(2)}%`);
}

// Evaluate complex queries
async function evaluateComplexQueries() {
    console.log('\n' + '='.repeat(70));
    console.log('🔬 EVALUATING COMPLEX QUERIES');
    console.log('='.repeat(70));

    const complexQueries = goldenDataset.dataset.filter((item) => item.category === 'complex_queries');
    const client = require('../config/geminiConfig');
    let complexAccuracy = [];

    for (let i = 0; i < complexQueries.length; i++) {
        const testCase = complexQueries[i];
        console.log(`\n[${i + 1}/${complexQueries.length}] Query: "${testCase.question.substring(0, 60)}..."`);

        try {
            // Multi-step evaluation
            const searchStartTime = performance.now();
            const searchResults = await HybridSearchService.searchWithFacets(testCase.question, { limit: 10 });
            const searchLatency = performance.now() - searchStartTime;

            const context =
                searchResults.data
                    ?.slice(0, 5)
                    .map((book) => `- "${book.title}" by ${book.author}`)
                    .join('\n') || 'No relevant books found';

            const systemPrompt = `You are an expert library assistant. Provide comprehensive answer to complex queries.

Available books:
${context}

Provide detailed, well-structured responses with book recommendations.`;

            const chatbotStartTime = performance.now();
            const response = await Promise.race([
                client.generateContent({
                    contents: [{ role: 'user', parts: [{ text: testCase.question }] }],
                    systemInstruction: systemPrompt,
                    generationConfig: { temperature: 0.8, maxOutputTokens: 300 },
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Chatbot timeout')), EVALUATION_CONFIG.timeout),
                ),
            ]);

            const chatbotLatency = performance.now() - chatbotStartTime;
            const responseText = response.response.text();

            // Check response completeness
            let completenessScore = 0;
            if (testCase.expected_answer_includes && testCase.expected_answer_includes.length > 0) {
                const matched = testCase.expected_answer_includes.filter((inc) =>
                    responseText.toLowerCase().includes(inc.toLowerCase()),
                );
                completenessScore = matched.length / testCase.expected_answer_includes.length;
            }

            complexAccuracy.push(completenessScore);

            console.log(`  Search Latency: ${searchLatency.toFixed(2)}ms`);
            console.log(`  Chatbot Latency: ${chatbotLatency.toFixed(2)}ms`);
            console.log(`  Completeness Score: ${(completenessScore * 100).toFixed(0)}%`);
            console.log(`  Results Found: ${searchResults.data?.length || 0}`);

            evaluation.results.push({
                type: 'complex',
                question: testCase.question.substring(0, 100),
                searchLatency: searchLatency,
                chatbotLatency: chatbotLatency,
                completenessScore: completenessScore,
                resultsFound: searchResults.data?.length || 0,
                passed: completenessScore >= 0.6,
            });
        } catch (error) {
            console.log(`  ✗ Error: ${error.message}`);
            evaluation.errors.push({
                type: 'complex',
                question: testCase.question.substring(0, 100),
                error: error.message,
            });

            evaluation.results.push({
                type: 'complex',
                question: testCase.question.substring(0, 100),
                searchLatency: 0,
                chatbotLatency: 0,
                completenessScore: 0,
                resultsFound: 0,
                passed: false,
            });
        }
    }

    const avgComplex =
        complexAccuracy.length > 0 ? complexAccuracy.reduce((a, b) => a + b, 0) / complexAccuracy.length : 0;

    console.log(`\n📊 Complex Query Results:`);
    console.log(`  Average Completeness: ${(avgComplex * 100).toFixed(2)}%`);
}

// Evaluate edge cases
async function evaluateEdgeCases() {
    console.log('\n' + '='.repeat(70));
    console.log('⚠️ EVALUATING EDGE CASES');
    console.log('='.repeat(70));

    const edgeCases = goldenDataset.dataset.filter((item) => item.category === 'edge_cases');

    for (let i = 0; i < edgeCases.length; i++) {
        const testCase = edgeCases[i];
        console.log(`\n[${i + 1}/${edgeCases.length}] Type: ${testCase.intent}`);

        try {
            const startTime = performance.now();

            const results = await Promise.race([
                HybridSearchService.searchWithFacets(testCase.question || 'empty', { limit: 10 }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Query timeout')), EVALUATION_CONFIG.timeout),
                ),
            ]);

            const latency = performance.now() - startTime;
            const gracefulHandling = !results.error || results.data !== undefined;

            console.log(`  ${gracefulHandling ? '✓' : '✗'} Gracefully handled`);
            console.log(`  Latency: ${latency.toFixed(2)}ms`);

            evaluation.results.push({
                type: 'edge_case',
                caseType: testCase.intent,
                gracefulHandling: gracefulHandling,
                latency: latency,
                passed: gracefulHandling,
            });
        } catch (error) {
            console.log(`  ⚠️  ${error.message}`);
            evaluation.results.push({
                type: 'edge_case',
                caseType: testCase.intent,
                gracefulHandling: false,
                latency: 0,
                passed: false,
            });
        }
    }

    const passedEdgeCases = evaluation.results.filter((r) => r.type === 'edge_case' && r.passed).length;
    console.log(`\n📊 Edge Case Results:`);
    console.log(`  Passed: ${passedEdgeCases}/${edgeCases.length}`);
}

// Generate evaluation report
async function generateEvaluationReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📋 EVALUATION SUMMARY');
    console.log('='.repeat(70));

    // Category breakdown
    const categories = {};
    goldenDataset.dataset.forEach((item) => {
        if (!categories[item.category]) {
            categories[item.category] = { total: 0, passed: 0 };
        }
        categories[item.category].total++;
    });

    evaluation.results.forEach((result) => {
        const category = result.type.replace('_', '');
        for (const cat in categories) {
            if (cat.includes(category) || category.includes(cat)) {
                if (result.passed) categories[cat].passed++;
                break;
            }
        }
    });

    evaluation.categoryBreakdown = categories;

    // Overall metrics
    const passedResults = evaluation.results.filter((r) => r.passed).length;
    const totalResults = evaluation.results.length;
    const overallAccuracy = (passedResults / totalResults) * 100;

    const reportPath = path.join(__dirname, `EVALUATION_RESULTS_${Date.now()}.json`);
    const textReportPath = path.join(__dirname, `EVALUATION_RESULTS_${Date.now()}.txt`);

    // Save JSON report
    evaluation.summary = {
        totalTests: totalResults,
        passed: passedResults,
        failed: totalResults - passedResults,
        accuracy: overallAccuracy,
        timestamp: evaluation.timestamp,
        errors: evaluation.errors.length,
    };

    fs.writeFileSync(reportPath, JSON.stringify(evaluation, null, 2));
    console.log(`\n✅ JSON Report saved: ${reportPath}`);

    // Generate text report
    let textReport = `DAVLIBRI SYSTEM EVALUATION REPORT
Generated: ${new Date().toLocaleString('vi-VN')}
================================================================================

EVALUATION SUMMARY
- Total Tests: ${totalResults}
- Passed: ${passedResults}
- Failed: ${totalResults - passedResults}
- Overall Accuracy: ${overallAccuracy.toFixed(2)}%
- Errors: ${evaluation.errors.length}

SEARCH QUERY METRICS
- Precision@5: ${(evaluation.metrics.precision['@5'] * 100).toFixed(2)}%
- Precision@10: ${(evaluation.metrics.precision['@10'] * 100).toFixed(2)}%
- Precision@20: ${(evaluation.metrics.precision['@20'] * 100).toFixed(2)}%
- Mean Reciprocal Rank (MRR): ${evaluation.metrics.mrr.toFixed(4)}

CATEGORY BREAKDOWN`;

    for (const [cat, stats] of Object.entries(evaluation.categoryBreakdown)) {
        textReport += `\n- ${cat}: ${stats.passed}/${stats.total} (${((stats.passed / stats.total) * 100).toFixed(2)}%)`;
    }

    textReport += `\n\nTOP ERRORS`;
    evaluation.errors.slice(0, 10).forEach((err, idx) => {
        textReport += `\n${idx + 1}. [${err.type}] ${err.question?.substring(0, 50)}: ${err.error}`;
    });

    textReport += `\n\n================================================================================
Generated by DAVLibri Evaluation System
================================================================================`;

    fs.writeFileSync(textReportPath, textReport);
    console.log(`✅ Text Report saved: ${textReportPath}`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ ACCURACY EVALUATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`\nOverall Accuracy: ${colors.cyan(overallAccuracy.toFixed(2) + '%')}`);
    console.log(`Tests Passed: ${colors.green(passedResults + '/' + totalResults)}`);
    console.log(
        `Errors: ${evaluation.errors.length > 0 ? colors.yellow(evaluation.errors.length) : colors.green('0')}`,
    );
}

// Main execution
async function runEvaluation() {
    try {
        console.log(colors.cyan('\n🚀 DAVLibri Accuracy Evaluation System'));
        console.log(colors.cyan('================================================================================'));

        // Connect to database
        console.log('\n🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log(colors.green('✓ Connected to MongoDB'));

        // Run evaluations
        await evaluateSearchQueries();
        await evaluateChatbotQuestions();
        await evaluateComplexQueries();
        await evaluateEdgeCases();

        // Generate report
        await generateEvaluationReport();
    } catch (error) {
        console.error(colors.red(`\n❌ Evaluation Error: ${error.message}`));
        console.error(error.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log(colors.cyan('\n📖 Evaluation finished. Check reports in scripts/ directory.'));
        process.exit(0);
    }
}

// Run if executed directly
if (require.main === module) {
    runEvaluation();
}

module.exports = { runEvaluation, evaluation };
