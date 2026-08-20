/**
 * BENCHMARK LATENCY - CHƯƠNG 5.2.1
 * =================================
 * Đo độ trễ (latency) của chatbot với 100 câu hỏi từ Golden Dataset
 * So sánh: Cache Miss vs Cache Hit
 *
 * Output: latency-results.csv (cho Biểu đồ 5.1 trong Excel)
 *
 * Target metrics:
 * - Cache Miss: ~2500ms (2.5s)
 * - Cache Hit: ~800ms (0.8s)
 * - Cache savings: 68%
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load services
const { askGeminiAI } = require('../src/utils/Chatbot/geminiAIWithRAG');
const cacheManager = require('../src/utils/Chatbot/cacheManager');
const FAQ = require('../src/models/faq.model');

// Load Golden Dataset
const goldenDataset = require('./golden_dataset_enhanced.json');

// Results storage
const results = {
    cacheMiss: [],
    cacheHit: [],
    metadata: {
        totalQuestions: 100,
        warmupQuestions: 40,
        newQuestions: 60,
        timestamp: new Date().toISOString(),
    },
};

/**
 * Connect to MongoDB
 */
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

/**
 * Test single question and measure latency
 */
async function testQuestion(question, testType) {
    const startTime = Date.now();

    try {
        // Simulate full chatbot flow
        // 1. Check FAQ first
        const faqs = await FAQ.find({
            isActive: true,
            $text: { $search: question },
        })
            .select('question answer')
            .limit(1);

        let response;
        if (faqs.length > 0) {
            response = faqs[0].answer;
        } else {
            // 2. Call Gemini AI with RAG
            const context = 'Hệ thống thư viện DAVLibri';
            response = await askGeminiAI(question, context);
        }

        const endTime = Date.now();
        const latency = endTime - startTime;

        return {
            success: true,
            latency,
            cached: testType === 'cache-hit',
        };
    } catch (error) {
        const endTime = Date.now();
        return {
            success: false,
            latency: endTime - startTime,
            error: error.message,
        };
    }
}

/**
 * Run benchmark
 */
async function runBenchmark() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║        BENCHMARK LATENCY - CHƯƠNG 5.2.1                   ║');
    console.log('║        Đo độ trễ Cache Miss vs Cache Hit                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    await connectDB();

    console.log('📊 Configuration:');
    console.log(`   Total questions: ${results.metadata.totalQuestions}`);
    console.log(`   Warmup (cache): ${results.metadata.warmupQuestions}`);
    console.log(`   New queries: ${results.metadata.newQuestions}\n`);

    // Phase 1: CACHE MISS (60 new questions)
    console.log('━'.repeat(60));
    console.log('📝 PHASE 1: CACHE MISS (New Questions)');
    console.log('━'.repeat(60));
    console.log('Testing 60 new questions without cache...\n');

    cacheManager.clearAll(); // Clear all cache

    const newQuestions = goldenDataset.slice(40, 100); // Last 60 questions

    for (let i = 0; i < newQuestions.length; i++) {
        const item = newQuestions[i];
        process.stdout.write(`[${i + 1}/60] Testing: "${item.question.substring(0, 50)}..."\r`);

        const result = await testQuestion(item.question, 'cache-miss');
        results.cacheMiss.push(result.latency);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\n✅ Phase 1 completed\n');

    // Phase 2: WARMUP (Populate cache)
    console.log('━'.repeat(60));
    console.log('🔥 PHASE 2: WARMUP (Populate Cache)');
    console.log('━'.repeat(60));
    console.log('Populating cache with 40 questions...\n');

    const warmupQuestions = goldenDataset.slice(0, 40);

    for (let i = 0; i < warmupQuestions.length; i++) {
        const item = warmupQuestions[i];
        process.stdout.write(`[${i + 1}/40] Caching: "${item.question.substring(0, 50)}..."\r`);

        await testQuestion(item.question, 'warmup');
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('\n✅ Phase 2 completed\n');

    // Phase 3: CACHE HIT (Repeat 40 cached questions)
    console.log('━'.repeat(60));
    console.log('⚡ PHASE 3: CACHE HIT (Cached Questions)');
    console.log('━'.repeat(60));
    console.log('Testing 40 cached questions...\n');

    for (let i = 0; i < warmupQuestions.length; i++) {
        const item = warmupQuestions[i];
        process.stdout.write(`[${i + 1}/40] Testing cached: "${item.question.substring(0, 50)}..."\r`);

        const result = await testQuestion(item.question, 'cache-hit');
        results.cacheHit.push(result.latency);

        await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log('\n✅ Phase 3 completed\n');

    // Calculate statistics
    const avgCacheMiss = results.cacheMiss.reduce((a, b) => a + b, 0) / results.cacheMiss.length;
    const avgCacheHit = results.cacheHit.reduce((a, b) => a + b, 0) / results.cacheHit.length;
    const savings = ((avgCacheMiss - avgCacheHit) / avgCacheMiss) * 100;

    console.log('━'.repeat(60));
    console.log('📊 RESULTS SUMMARY');
    console.log('━'.repeat(60));
    console.log(`Cache Miss (60 queries):`);
    console.log(`   Average: ${avgCacheMiss.toFixed(0)}ms (${(avgCacheMiss / 1000).toFixed(2)}s)`);
    console.log(`   Min: ${Math.min(...results.cacheMiss)}ms`);
    console.log(`   Max: ${Math.max(...results.cacheMiss)}ms`);
    console.log();
    console.log(`Cache Hit (40 queries):`);
    console.log(`   Average: ${avgCacheHit.toFixed(0)}ms (${(avgCacheHit / 1000).toFixed(2)}s)`);
    console.log(`   Min: ${Math.min(...results.cacheHit)}ms`);
    console.log(`   Max: ${Math.max(...results.cacheHit)}ms`);
    console.log();
    console.log(`💰 Cache Savings: ${savings.toFixed(1)}% faster`);
    console.log(`🎯 Target: 68% (Đạt: ${savings >= 60 ? '✅' : '⚠️'})`);
    console.log('━'.repeat(60));

    // Export to CSV
    await exportToCSV(avgCacheMiss, avgCacheHit, savings);

    // Export detailed JSON
    await exportToJSON({
        summary: {
            avgCacheMiss,
            avgCacheHit,
            savings,
            totalQuestions: results.metadata.totalQuestions,
        },
        raw: results,
    });

    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    console.log('✨ Benchmark completed!\n');
}

/**
 * Export results to CSV for Excel chart
 */
async function exportToCSV(avgCacheMiss, avgCacheHit, savings) {
    const csvPath = path.join(__dirname, '../benchmark-results/latency-results.csv');
    const dir = path.dirname(csvPath);

    // Create directory if not exists
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const csvContent = `Test Type,Average Latency (ms),Average Latency (s),Samples
Cache Miss,${avgCacheMiss.toFixed(0)},${(avgCacheMiss / 1000).toFixed(2)},60
Cache Hit,${avgCacheHit.toFixed(0)},${(avgCacheHit / 1000).toFixed(2)},40
Savings,,${savings.toFixed(1)}%,

Detailed Data
Type,Latency (ms)
${results.cacheMiss.map((l) => `Cache Miss,${l}`).join('\n')}
${results.cacheHit.map((l) => `Cache Hit,${l}`).join('\n')}
`;

    fs.writeFileSync(csvPath, csvContent, 'utf8');
    console.log(`\n📄 CSV exported: ${csvPath}`);
    console.log('   → Import vào Excel để tạo Biểu đồ 5.1');
}

/**
 * Export detailed results to JSON
 */
async function exportToJSON(data) {
    const jsonPath = path.join(__dirname, '../benchmark-results/latency-results.json');

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`📄 JSON exported: ${jsonPath}`);
}

/**
 * Run the benchmark
 */
runBenchmark().catch((error) => {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
});
