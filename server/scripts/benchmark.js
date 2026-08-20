const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const colors = require('colors');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Models
const Book = require('../src/models/books.model');
const HybridSearchService = require('../src/services/HybridSearchService');

// Configuration
const BENCHMARK_CONFIG = {
    search_iterations: 10,
    chatbot_iterations: 5,
    cache_test_iterations: 20,
    timeout: 30000, // 30 seconds per operation
};

// Test queries
const SEARCH_QUERIES = [
    'Python lập trình',
    'database management',
    'web development JavaScript',
    'machine learning AI',
    'cloud computing AWS',
    'agile scrum project management',
    'microservices docker kubernetes',
    'security cybersecurity',
    'data structures algorithms',
    'testing quality assurance',
];

const CHATBOT_QUESTIONS = [
    'Sách nào về Python tốt nhất?',
    'Làm sao để học Machine Learning?',
    'Có sách về Web Development không?',
    'Sách về DevOps hướng dẫn như thế nào?',
    'Nên bắt đầu với ngôn ngữ lập trình nào?',
];

// Performance metrics
let metrics = {
    timestamp: new Date().toISOString(),
    system: {
        nodeVersion: process.version,
        platform: process.platform,
        cpuCount: require('os').cpus().length,
        totalMemory: require('os').totalmem() / 1024 / 1024 / 1024, // GB
    },
    searches: {
        total: 0,
        successful: 0,
        failed: 0,
        latencies: [],
        averageLatency: 0,
        minLatency: Infinity,
        maxLatency: -Infinity,
        resultsCount: [],
    },
    cache: {
        hitRate: 0,
        missRate: 0,
        hits: 0,
        misses: 0,
        averageSize: 0,
    },
    chatbot: {
        total: 0,
        successful: 0,
        failed: 0,
        latencies: [],
        averageLatency: 0,
        tokensGenerated: [],
        averageTokens: 0,
    },
    database: {
        totalBooks: 0,
        booksWithEmbeddings: 0,
        avgEmbeddingDimension: 0,
        indexesInfo: [],
    },
    summary: {
        duration: 0,
        successRate: 0,
        performance: {
            cacheImprovement: 0,
            averageSearchLatency: 0,
            averageChatbotLatency: 0,
            targetMet: {},
        },
    },
};

// Helper functions
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatLatency = (ms) => {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};

const formatMemory = (bytes) => {
    const mb = bytes / 1024 / 1024;
    if (mb < 1024) return `${mb.toFixed(2)}MB`;
    return `${(mb / 1024).toFixed(2)}GB`;
};

// Main benchmark functions
async function benchmarkSearch() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 SEARCH PERFORMANCE BENCHMARK');
    console.log('='.repeat(60));

    let totalLatency = 0;
    const startTime = Date.now();

    for (let i = 0; i < SEARCH_QUERIES.length; i++) {
        const query = SEARCH_QUERIES[i];
        console.log(`\n[${i + 1}/${SEARCH_QUERIES.length}] Searching: "${query}"`);

        try {
            const queryStartTime = performance.now();

            // Hybrid search with cache
            const results = await Promise.race([
                HybridSearchService.searchWithFacets(query, { limit: 10 }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Search timeout')), BENCHMARK_CONFIG.timeout),
                ),
            ]);

            const queryLatency = performance.now() - queryStartTime;
            totalLatency += queryLatency;

            metrics.searches.latencies.push(queryLatency);
            metrics.searches.successful++;
            metrics.searches.resultsCount.push(results.data?.length || 0);

            if (queryLatency < metrics.searches.minLatency) metrics.searches.minLatency = queryLatency;
            if (queryLatency > metrics.searches.maxLatency) metrics.searches.maxLatency = queryLatency;

            console.log(`  ✓ Found ${results.data?.length || 0} results in ${formatLatency(queryLatency)}`);
            if (results.facets) {
                console.log(`  📊 Facets: ${JSON.stringify(results.facets).substring(0, 100)}...`);
            }
        } catch (error) {
            metrics.searches.failed++;
            console.log(`  ✗ Error: ${error.message}`);
        }

        metrics.searches.total++;
    }

    // Test cache effectiveness
    console.log('\n' + '-'.repeat(60));
    console.log('Testing cache effectiveness...');
    let cacheHits = 0;
    let cacheMisses = 0;

    for (let i = 0; i < BENCHMARK_CONFIG.cache_test_iterations; i++) {
        const query = SEARCH_QUERIES[i % SEARCH_QUERIES.length];
        try {
            const result = await HybridSearchService.searchWithFacets(query, { limit: 10 });
            if (result.cached) {
                cacheHits++;
            } else {
                cacheMisses++;
            }
        } catch (error) {
            cacheMisses++;
        }
    }

    metrics.searches.averageLatency = totalLatency / SEARCH_QUERIES.length;
    metrics.cache.hits = cacheHits;
    metrics.cache.misses = cacheMisses;
    metrics.cache.hitRate = (cacheHits / (cacheHits + cacheMisses)) * 100;
    metrics.cache.missRate = (cacheMisses / (cacheHits + cacheMisses)) * 100;

    console.log(`\n📊 Cache Statistics:`);
    console.log(`  Hit Rate: ${metrics.cache.hitRate.toFixed(2)}%`);
    console.log(`  Miss Rate: ${metrics.cache.missRate.toFixed(2)}%`);
    console.log(`  Hits: ${cacheHits}, Misses: ${cacheMisses}`);

    console.log(`\n📈 Search Metrics:`);
    console.log(`  Total Searches: ${metrics.searches.total}`);
    console.log(`  Successful: ${metrics.searches.successful}`);
    console.log(`  Failed: ${metrics.searches.failed}`);
    console.log(`  Success Rate: ${((metrics.searches.successful / metrics.searches.total) * 100).toFixed(2)}%`);
    console.log(`  Average Latency: ${formatLatency(metrics.searches.averageLatency)}`);
    console.log(`  Min Latency: ${formatLatency(metrics.searches.minLatency)}`);
    console.log(`  Max Latency: ${formatLatency(metrics.searches.maxLatency)}`);
    console.log(
        `  Avg Results per Query: ${(metrics.searches.resultsCount.reduce((a, b) => a + b, 0) / metrics.searches.resultsCount.length).toFixed(2)}`,
    );
}

async function benchmarkChatbot() {
    console.log('\n' + '='.repeat(60));
    console.log('💬 CHATBOT PERFORMANCE BENCHMARK');
    console.log('='.repeat(60));

    let totalLatency = 0;
    const client = require('../config/geminiConfig');

    for (let i = 0; i < CHATBOT_QUESTIONS.length; i++) {
        const question = CHATBOT_QUESTIONS[i];
        console.log(`\n[${i + 1}/${CHATBOT_QUESTIONS.length}] Question: "${question}"`);

        try {
            const queryStartTime = performance.now();

            // Simulate RAG chatbot
            const searchResults = await HybridSearchService.searchWithFacets(question, { limit: 5 });
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

            const response = await client.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: question }],
                    },
                ],
                systemInstruction: systemPrompt,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 200,
                },
            });

            const queryLatency = performance.now() - queryStartTime;
            totalLatency += queryLatency;

            metrics.chatbot.latencies.push(queryLatency);
            metrics.chatbot.successful++;

            const responseText = response.response.text();
            const estimatedTokens = Math.ceil(responseText.length / 4);
            metrics.chatbot.tokensGenerated.push(estimatedTokens);

            console.log(`  ✓ Response time: ${formatLatency(queryLatency)}`);
            console.log(`  📝 Tokens (est.): ${estimatedTokens}`);
            console.log(`  💬 Response: "${responseText.substring(0, 100)}..."`);
        } catch (error) {
            metrics.chatbot.failed++;
            console.log(`  ✗ Error: ${error.message}`);
        }

        metrics.chatbot.total++;
    }

    metrics.chatbot.averageLatency = totalLatency / CHATBOT_QUESTIONS.length;
    metrics.chatbot.averageTokens =
        metrics.chatbot.tokensGenerated.length > 0
            ? metrics.chatbot.tokensGenerated.reduce((a, b) => a + b, 0) / metrics.chatbot.tokensGenerated.length
            : 0;

    console.log(`\n📈 Chatbot Metrics:`);
    console.log(`  Total Questions: ${metrics.chatbot.total}`);
    console.log(`  Successful: ${metrics.chatbot.successful}`);
    console.log(`  Failed: ${metrics.chatbot.failed}`);
    console.log(`  Success Rate: ${((metrics.chatbot.successful / metrics.chatbot.total) * 100).toFixed(2)}%`);
    console.log(`  Average Latency: ${formatLatency(metrics.chatbot.averageLatency)}`);
    console.log(`  Average Tokens Generated: ${metrics.chatbot.averageTokens.toFixed(0)}`);
}

async function benchmarkDatabase() {
    console.log('\n' + '='.repeat(60));
    console.log('🗄️ DATABASE PERFORMANCE METRICS');
    console.log('='.repeat(60));

    try {
        const totalBooks = await Book.countDocuments();
        const booksWithEmbeddings = await Book.countDocuments({ embedding: { $exists: true, $ne: null } });

        metrics.database.totalBooks = totalBooks;
        metrics.database.booksWithEmbeddings = booksWithEmbeddings;

        // Sample embedding dimension
        const sampleBook = await Book.findOne({ embedding: { $exists: true } });
        if (sampleBook?.embedding) {
            metrics.database.avgEmbeddingDimension = sampleBook.embedding.length;
        }

        // Get collection info
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        for (const collection of collections) {
            const col = db.collection(collection.name);
            const stats = await db
                .collection(collection.name)
                .stats()
                .catch(() => null);
            if (stats) {
                metrics.database.indexesInfo.push({
                    collection: collection.name,
                    documentCount: stats.count,
                    storageSize: formatMemory(stats.size),
                    avgDocumentSize: (stats.size / stats.count).toFixed(2) + ' bytes',
                    indexes: stats.indexSizes ? Object.keys(stats.indexSizes).length : 0,
                });
            }
        }

        console.log(`\n📊 Database Statistics:`);
        console.log(`  Total Books: ${totalBooks}`);
        console.log(
            `  Books with Embeddings: ${booksWithEmbeddings} (${((booksWithEmbeddings / totalBooks) * 100).toFixed(2)}%)`,
        );
        console.log(`  Embedding Dimension: ${metrics.database.avgEmbeddingDimension || 'N/A'}`);
        console.log(`\n🗂️ Collections:`);
        metrics.database.indexesInfo.forEach((info) => {
            console.log(`  ${info.collection}:`);
            console.log(`    Documents: ${info.documentCount}`);
            console.log(`    Storage: ${info.storageSize}`);
            console.log(`    Avg Size: ${info.avgDocumentSize}`);
            console.log(`    Indexes: ${info.indexes}`);
        });
    } catch (error) {
        console.error(`✗ Database stats error: ${error.message}`);
    }
}

async function calculateCacheImprovement() {
    console.log('\n' + '='.repeat(60));
    console.log('⚡ CACHE IMPROVEMENT ANALYSIS');
    console.log('='.repeat(60));

    // Simulate searches without cache
    console.log('\nMeasuring searches without cache...');
    let totalWithoutCache = 0;
    const noCacheLatencies = [];

    for (let i = 0; i < 5; i++) {
        const query = SEARCH_QUERIES[i];
        try {
            const startTime = performance.now();
            await HybridSearchService.searchWithFacets(query, { limit: 10, noCache: true });
            const latency = performance.now() - startTime;
            noCacheLatencies.push(latency);
            totalWithoutCache += latency;
        } catch (error) {
            console.log(`Error in no-cache search: ${error.message}`);
        }
    }

    const avgWithoutCache = totalWithoutCache / 5;
    const avgWithCache = metrics.searches.averageLatency;
    const improvement = ((avgWithoutCache - avgWithCache) / avgWithoutCache) * 100;

    metrics.summary.performance.cacheImprovement = improvement;

    console.log(`\n📈 Cache Impact:`);
    console.log(`  Average Latency (No Cache): ${formatLatency(avgWithoutCache)}`);
    console.log(`  Average Latency (With Cache): ${formatLatency(avgWithCache)}`);
    console.log(`  Improvement: ${improvement.toFixed(2)}%`);
}

async function generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 BENCHMARK SUMMARY');
    console.log('='.repeat(60));

    metrics.summary.successRate =
        ((metrics.searches.successful + metrics.chatbot.successful) /
            (metrics.searches.total + metrics.chatbot.total)) *
        100;
    metrics.summary.performance.averageSearchLatency = metrics.searches.averageLatency;
    metrics.summary.performance.averageChatbotLatency = metrics.chatbot.averageLatency;

    // Check targets
    metrics.summary.performance.targetMet = {
        searchLatency: metrics.searches.averageLatency < 500,
        cacheHitRate: metrics.cache.hitRate >= 40,
        chatbotLatency: metrics.chatbot.averageLatency < 5000,
        systemAvailability: metrics.summary.successRate >= 99.5,
    };

    const timestamp = new Date().toLocaleString('vi-VN');
    const reportPath = path.join(__dirname, `BENCHMARK_RESULTS_${Date.now()}.json`);
    const textReportPath = path.join(__dirname, `BENCHMARK_RESULTS_${Date.now()}.txt`);

    // Save JSON report
    fs.writeFileSync(reportPath, JSON.stringify(metrics, null, 2));
    console.log(`\n✅ JSON Report saved: ${reportPath}`);

    // Generate text report
    let textReport = `DAVLIBRI SYSTEM BENCHMARK REPORT
Generated: ${timestamp}
================================================================================

SYSTEM INFORMATION
- Node Version: ${metrics.system.nodeVersion}
- Platform: ${metrics.system.platform}
- CPU Count: ${metrics.system.cpuCount}
- Total Memory: ${metrics.system.totalMemory.toFixed(2)}GB

SEARCH PERFORMANCE
- Total Searches: ${metrics.searches.total}
- Successful: ${metrics.searches.successful}
- Failed: ${metrics.searches.failed}
- Success Rate: ${((metrics.searches.successful / metrics.searches.total) * 100).toFixed(2)}%
- Average Latency: ${formatLatency(metrics.searches.averageLatency)}
- Min Latency: ${formatLatency(metrics.searches.minLatency)}
- Max Latency: ${formatLatency(metrics.searches.maxLatency)}

CACHE PERFORMANCE
- Hit Rate: ${metrics.cache.hitRate.toFixed(2)}%
- Miss Rate: ${metrics.cache.missRate.toFixed(2)}%
- Hits: ${metrics.cache.hits}
- Misses: ${metrics.cache.misses}
- Cache Improvement: ${metrics.summary.performance.cacheImprovement.toFixed(2)}%

CHATBOT PERFORMANCE
- Total Questions: ${metrics.chatbot.total}
- Successful: ${metrics.chatbot.successful}
- Failed: ${metrics.chatbot.failed}
- Success Rate: ${((metrics.chatbot.successful / metrics.chatbot.total) * 100).toFixed(2)}%
- Average Latency: ${formatLatency(metrics.chatbot.averageLatency)}
- Average Tokens: ${metrics.chatbot.averageTokens.toFixed(0)}

DATABASE STATISTICS
- Total Books: ${metrics.database.totalBooks}
- Books with Embeddings: ${metrics.database.booksWithEmbeddings}
- Embedding Dimension: ${metrics.database.avgEmbeddingDimension}

PERFORMANCE TARGETS
- Search Latency <500ms: ${metrics.summary.performance.targetMet.searchLatency ? '✓ MET' : '✗ FAILED'}
- Cache Hit Rate >=40%: ${metrics.summary.performance.targetMet.cacheHitRate ? '✓ MET' : '✗ FAILED'}
- Chatbot Latency <5s: ${metrics.summary.performance.targetMet.chatbotLatency ? '✓ MET' : '✗ FAILED'}
- System Availability >=99.5%: ${metrics.summary.performance.targetMet.systemAvailability ? '✓ MET' : '✗ FAILED'}

OVERALL SUCCESS RATE: ${metrics.summary.successRate.toFixed(2)}%
================================================================================`;

    fs.writeFileSync(textReportPath, textReport);
    console.log(`✅ Text Report saved: ${textReportPath}`);

    console.log('\n' + '='.repeat(60));
    console.log('🎯 PERFORMANCE TARGETS');
    console.log('='.repeat(60));
    console.log(
        `  Search Latency <500ms: ${metrics.summary.performance.targetMet.searchLatency ? colors.green('✓ MET') : colors.red('✗ FAILED')}`,
    );
    console.log(
        `  Cache Hit Rate >=40%: ${metrics.summary.performance.targetMet.cacheHitRate ? colors.green('✓ MET') : colors.red('✗ FAILED')}`,
    );
    console.log(
        `  Chatbot Latency <5s: ${metrics.summary.performance.targetMet.chatbotLatency ? colors.green('✓ MET') : colors.red('✗ FAILED')}`,
    );
    console.log(
        `  System Availability >=99.5%: ${metrics.summary.performance.targetMet.systemAvailability ? colors.green('✓ MET') : colors.red('✗ FAILED')}`,
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ BENCHMARK COMPLETE');
    console.log('='.repeat(60));
}

// Main execution
async function runBenchmark() {
    const benchmarkStartTime = Date.now();

    try {
        // Connect to database
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB');

        // Run benchmarks
        await benchmarkDatabase();
        await benchmarkSearch();
        await calculateCacheImprovement();
        await benchmarkChatbot();

        // Generate report
        metrics.summary.duration = (Date.now() - benchmarkStartTime) / 1000;
        await generateReport();
    } catch (error) {
        console.error(colors.red(`\n❌ Benchmark Error: ${error.message}`));
        console.error(error.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n📖 Benchmark finished. Check reports in scripts/ directory.');
        process.exit(0);
    }
}

// Run if executed directly
if (require.main === module) {
    runBenchmark();
}

module.exports = { runBenchmark, metrics };
