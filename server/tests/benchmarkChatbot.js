/**
 * Benchmark script: Test và so sánh performance của chatbot
 * So sánh: Before vs After optimization
 *
 * Usage: node benchmarkChatbot.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000'; // Thay đổi nếu cần

// Test cases
const TEST_QUESTIONS = [
    'Tìm sách về kinh tế',
    'Sách ASEAN có những quyển nào?',
    'Làm thế nào để thuê sách?',
    'Giá thuê sách bao nhiêu tiền một ngày?',
    'Tôi muốn tìm sách của Nguyễn Nhật Ánh',
    'Sách nào về lịch sử Việt Nam?',
    'Thời gian thuê tối đa là bao lâu?',
    'Có giao sách tận nhà không?',
    'Tôi bị mất sách thì phải làm sao?',
    'Cách thanh toán như thế nào?',
];

// Colors for console
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

/**
 * Test single question
 */
async function testQuestion(question) {
    const startTime = Date.now();

    try {
        const response = await axios.post(`${BASE_URL}/api/chatbot/ask`, {
            question,
        });

        const endTime = Date.now();
        const latency = endTime - startTime;

        return {
            success: true,
            latency,
            source: response.data.metadata.source,
            cached: response.data.message?.includes('cached') || false,
            hasBooks: response.data.metadata.relatedBooks?.length > 0,
            answer: response.data.metadata.answer,
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
    console.log(`\n${colors.cyan}╔════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║     CHATBOT PERFORMANCE BENCHMARK TEST        ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════════════╝${colors.reset}\n`);

    const results = [];
    let totalLatency = 0;
    let cacheHits = 0;
    let aiCalls = 0;
    let faqHits = 0;
    let errors = 0;

    // ========================================
    // ROUND 1: Cold start (no cache)
    // ========================================
    console.log(`${colors.yellow}📊 ROUND 1: Cold Start (No Cache)${colors.reset}\n`);

    for (let i = 0; i < TEST_QUESTIONS.length; i++) {
        const question = TEST_QUESTIONS[i];
        process.stdout.write(`  ${i + 1}. Testing: "${question.substring(0, 40)}..." `);

        const result = await testQuestion(question);
        results.push(result);

        if (result.success) {
            totalLatency += result.latency;

            if (result.source === 'faq') faqHits++;
            else if (result.source === 'gemini-ai') aiCalls++;

            console.log(`${colors.green}✓${colors.reset} ${result.latency}ms [${result.source}]`);
        } else {
            errors++;
            console.log(`${colors.red}✗${colors.reset} ${result.error}`);
        }

        // Delay between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // ========================================
    // ROUND 2: Warm cache
    // ========================================
    console.log(`\n${colors.yellow}📊 ROUND 2: Warm Cache (Repeat Questions)${colors.reset}\n`);

    const warmResults = [];
    let warmTotalLatency = 0;

    for (let i = 0; i < 5; i++) {
        const question = TEST_QUESTIONS[i]; // Test first 5 questions again
        process.stdout.write(`  ${i + 1}. Testing: "${question.substring(0, 40)}..." `);

        const result = await testQuestion(question);
        warmResults.push(result);

        if (result.success) {
            warmTotalLatency += result.latency;

            if (result.cached) cacheHits++;

            console.log(
                `${colors.green}✓${colors.reset} ${result.latency}ms [${result.cached ? 'CACHED' : result.source}]`,
            );
        } else {
            console.log(`${colors.red}✗${colors.reset} ${result.error}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // ========================================
    // STATISTICS
    // ========================================
    console.log(`\n${colors.cyan}╔════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║              BENCHMARK RESULTS                 ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════════════╝${colors.reset}\n`);

    const successCount = results.filter((r) => r.success).length;
    const avgLatency = successCount > 0 ? (totalLatency / successCount).toFixed(0) : 0;
    const warmAvgLatency = warmResults.length > 0 ? (warmTotalLatency / warmResults.length).toFixed(0) : 0;

    console.log(`${colors.blue}📈 Cold Start Statistics:${colors.reset}`);
    console.log(`   Total Requests:        ${TEST_QUESTIONS.length}`);
    console.log(`   Successful:            ${colors.green}${successCount}${colors.reset}`);
    console.log(`   Failed:                ${errors > 0 ? colors.red : colors.green}${errors}${colors.reset}`);
    console.log(`   Average Latency:       ${avgLatency}ms`);
    console.log(`   FAQ Hits:              ${faqHits}`);
    console.log(`   AI Calls:              ${aiCalls}`);

    console.log(`\n${colors.blue}🔥 Warm Cache Statistics:${colors.reset}`);
    console.log(`   Cache Hits:            ${colors.green}${cacheHits}${colors.reset}`);
    console.log(`   Average Latency:       ${warmAvgLatency}ms`);
    console.log(
        `   Speedup:               ${
            avgLatency > 0 ? ((avgLatency / warmAvgLatency) * 100 - 100).toFixed(1) : 0
        }% faster`,
    );

    // ========================================
    // BREAKDOWN BY SOURCE
    // ========================================
    console.log(`\n${colors.blue}📊 Response Source Breakdown:${colors.reset}`);
    const faqPercent = ((faqHits / successCount) * 100).toFixed(1);
    const aiPercent = ((aiCalls / successCount) * 100).toFixed(1);
    console.log(`   FAQ:                   ${faqHits} (${faqPercent}%)`);
    console.log(`   AI (RAG):              ${aiCalls} (${aiPercent}%)`);

    // ========================================
    // RECOMMENDATIONS
    // ========================================
    console.log(`\n${colors.yellow}💡 Recommendations:${colors.reset}`);

    if (faqPercent < 30) {
        console.log(`   ${colors.red}⚠️${colors.reset}  FAQ hit rate thấp (${faqPercent}%) - Cần thêm FAQs phổ biến`);
    } else {
        console.log(`   ${colors.green}✓${colors.reset}  FAQ hit rate tốt (${faqPercent}%)`);
    }

    if (avgLatency > 2000) {
        console.log(`   ${colors.red}⚠️${colors.reset}  Latency cao (${avgLatency}ms) - Xem xét tối ưu RAG search`);
    } else if (avgLatency > 1000) {
        console.log(`   ${colors.yellow}⚠️${colors.reset}  Latency trung bình (${avgLatency}ms) - Có thể cải thiện`);
    } else {
        console.log(`   ${colors.green}✓${colors.reset}  Latency tốt (${avgLatency}ms)`);
    }

    if (cacheHits >= 4) {
        console.log(`   ${colors.green}✓${colors.reset}  Cache hoạt động hiệu quả (${cacheHits}/5 hits)`);
    } else {
        console.log(`   ${colors.yellow}⚠️${colors.reset}  Cache có thể cần kiểm tra (${cacheHits}/5 hits)`);
    }

    console.log(`\n${colors.cyan}════════════════════════════════════════════════${colors.reset}\n`);
}

// Run benchmark
runBenchmark().catch((error) => {
    console.error(`\n${colors.red}❌ Benchmark failed:${colors.reset}`, error.message);
    process.exit(1);
});
