/**
 * Comprehensive Performance Benchmark Suite for DAVLibri
 * Tests latency, cache hit rate, accuracy, and cost metrics
 * Run with: npm run benchmark
 */

const axios = require('axios');
const crypto = require('crypto');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

class BenchmarkSuite {
    constructor() {
        this.results = {
            search: [],
            chatbot: [],
            cache: [],
            accuracy: [],
        };
        this.startTime = Date.now();
    }

    log(message, data = {}) {
        console.log(`[${new Date().toLocaleTimeString()}] ${message}`, data);
    }

    async delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Test 1: Search Performance (Latency & Cache)
     */
    async benchmarkSearch() {
        this.log('📊 Benchmarking Search Performance...');

        const queries = [
            'javascript',
            'python programming',
            'data science',
            'web development',
            'machine learning',
            'database design',
            'cloud computing',
            'security',
            'algorithms',
            'oop',
        ];

        const results = [];

        for (const query of queries) {
            try {
                // First request (cache miss)
                const start1 = Date.now();
                const response1 = await axios.get(`${API_URL}/books/search?q=${encodeURIComponent(query)}`);
                const duration1 = Date.now() - start1;

                // Second request (should be cached)
                const start2 = Date.now();
                const response2 = await axios.get(`${API_URL}/books/search?q=${encodeURIComponent(query)}`);
                const duration2 = Date.now() - start2;

                results.push({
                    query,
                    firstRequest: duration1,
                    secondRequest: duration2,
                    cacheImprovement: (((duration1 - duration2) / duration1) * 100).toFixed(2),
                    resultCount: response1.data.data?.length || 0,
                });

                this.log(`✓ ${query}`, {
                    first: `${duration1}ms`,
                    second: `${duration2}ms`,
                    improvement: `${(((duration1 - duration2) / duration1) * 100).toFixed(2)}%`,
                });
            } catch (error) {
                this.log(`✗ ${query}`, { error: error.message });
            }

            await this.delay(100); // Rate limit
        }

        this.results.search = results;
        return results;
    }

    /**
     * Test 2: Chatbot Performance (Latency & Token Usage)
     */
    async benchmarkChatbot() {
        this.log('💬 Benchmarking Chatbot Performance...');

        const questions = [
            'What are the best programming books?',
            'Can you recommend books for beginners?',
            'What subjects do you have in the library?',
            'How can I find books about machine learning?',
            'What is your library policy?',
        ];

        const results = [];
        let totalTokens = 0;

        for (const question of questions) {
            try {
                const start = Date.now();
                const response = await axios.post(`${API_URL}/chatbot/ask`, {
                    question,
                    userId: 'benchmark-user',
                });
                const duration = Date.now() - start;

                const tokens = response.data.data?.tokenUsage || 0;
                totalTokens += tokens;

                results.push({
                    question,
                    latency: duration,
                    tokens,
                    response: response.data.data?.response?.substring(0, 100) + '...',
                });

                this.log(`✓ Q: "${question.substring(0, 40)}..."`, {
                    latency: `${duration}ms`,
                    tokens: tokens,
                });
            } catch (error) {
                this.log(`✗ Chatbot request failed`, { error: error.message });
            }

            await this.delay(500); // VNPay rate limit
        }

        this.results.chatbot = results;
        return { results, totalTokens };
    }

    /**
     * Test 3: Cache Performance
     */
    async benchmarkCache() {
        this.log('⚡ Benchmarking Cache Performance...');

        const testKey = 'benchmark-' + Date.now();
        const testValue = { data: 'test', timestamp: Date.now() };

        try {
            // Test cache manager via API
            const response = await axios.get(`${API_URL}/cache/stats`);

            const stats = response.data.data || {};
            this.results.cache = {
                hitRate: stats.hitRate || '0%',
                hits: stats.hits || 0,
                misses: stats.misses || 0,
                size: stats.size || 0,
                maxSize: stats.maxSize || 1000,
                utilization: stats.utilizationPercent || '0%',
            };

            this.log('✓ Cache Stats Retrieved', this.results.cache);
        } catch (error) {
            this.log('✗ Cache benchmark failed', { error: error.message });
        }

        return this.results.cache;
    }

    /**
     * Test 4: Accuracy Evaluation with Golden Dataset
     */
    async benchmarkAccuracy() {
        this.log('🎯 Benchmarking Search Accuracy...');

        const goldenDataset = [
            {
                query: 'object oriented programming',
                expectedBooks: ['Design Patterns', 'OOP Concepts', 'Java Programming'],
            },
            {
                query: 'database management systems',
                expectedBooks: ['Database Design', 'SQL', 'DBMS'],
            },
            {
                query: 'web development',
                expectedBooks: ['React', 'JavaScript', 'Web Design'],
            },
            {
                query: 'machine learning algorithms',
                expectedBooks: ['ML Basics', 'Python ML', 'Algorithms'],
            },
            {
                query: 'cloud computing',
                expectedBooks: ['AWS', 'Azure', 'Cloud Architecture'],
            },
        ];

        const results = [];

        for (const item of goldenDataset) {
            try {
                const response = await axios.get(`${API_URL}/books/search?q=${encodeURIComponent(item.query)}`);

                const retrievedBooks = response.data.data || [];
                const retrievedTitles = retrievedBooks.map((b) => b.title.toLowerCase()).slice(0, 5);

                const matches = item.expectedBooks.filter((expected) =>
                    retrievedTitles.some((title) => title.includes(expected.toLowerCase())),
                );

                const accuracy = ((matches.length / item.expectedBooks.length) * 100).toFixed(2);

                results.push({
                    query: item.query,
                    expectedCount: item.expectedBooks.length,
                    matchedCount: matches.length,
                    accuracy: accuracy,
                    coverage: `${matches.length}/${item.expectedBooks.length}`,
                });

                this.log(`✓ "${item.query}"`, {
                    accuracy: `${accuracy}%`,
                    coverage: `${matches.length}/${item.expectedBooks.length}`,
                });
            } catch (error) {
                this.log(`✗ Accuracy test failed for "${item.query}"`, {
                    error: error.message,
                });
            }

            await this.delay(100);
        }

        const avgAccuracy = results.reduce((sum, r) => sum + parseFloat(r.accuracy), 0) / results.length;
        this.results.accuracy = {
            tests: results,
            averageAccuracy: avgAccuracy.toFixed(2),
        };

        return this.results.accuracy;
    }

    /**
     * Test 5: Cost Analysis
     */
    analyzeCosts() {
        this.log('💰 Cost Analysis...');

        const costAnalysis = {
            api: {
                searchCost: 0.0001, // Cost per search
                chatbotCost: 0.0003, // Cost per chatbot call
                dailySearches: 1000,
                dailyChatbot: 500,
                monthlyCost: 0,
            },
            gemini: {
                inputCostPer1m: 0.075, // USD per 1M input tokens
                outputCostPer1m: 0.3, // USD per 1M output tokens
                avgInputTokens: 500,
                avgOutputTokens: 200,
            },
            cache: {
                hitRate: 0.45, // 45% cache hit rate
                costSavings: 0.45 * 100 * 30, // Monthly savings in token costs
            },
        };

        // Calculate monthly costs
        costAnalysis.api.monthlyCost =
            costAnalysis.api.dailySearches * 30 * costAnalysis.api.searchCost +
            costAnalysis.api.dailyChatbot * 30 * costAnalysis.api.chatbotCost;

        const monthlyGeminiCost =
            (costAnalysis.gemini.avgInputTokens *
                costAnalysis.api.dailyChatbot *
                30 *
                costAnalysis.gemini.inputCostPer1m) /
                1000000 +
            (costAnalysis.gemini.avgOutputTokens *
                costAnalysis.api.dailyChatbot *
                30 *
                costAnalysis.gemini.outputCostPer1m) /
                1000000;

        this.log('Cost Analysis Results', {
            monthlyAPICost: `$${costAnalysis.api.monthlyCost.toFixed(2)}`,
            monthlyGeminiCost: `$${monthlyGeminiCost.toFixed(2)}`,
            cacheHitRate: `${(costAnalysis.cache.hitRate * 100).toFixed(2)}%`,
            monthlySavings: `$${costAnalysis.cache.costSavings.toFixed(2)}`,
        });

        return costAnalysis;
    }

    /**
     * Generate Report
     */
    generateReport() {
        const duration = Date.now() - this.startTime;

        const report = {
            timestamp: new Date().toISOString(),
            durationMs: duration,
            summary: {
                searchTests: this.results.search.length,
                chatbotTests: this.results.chatbot.length,
                accuracyTests: this.results.accuracy.tests?.length || 0,
            },
            performance: {
                avgSearchLatency: (
                    this.results.search.reduce((sum, r) => sum + r.firstRequest, 0) / this.results.search.length
                ).toFixed(2),
                avgCacheImprovement: (
                    this.results.search.reduce((sum, r) => sum + parseFloat(r.cacheImprovement), 0) /
                    this.results.search.length
                ).toFixed(2),
                avgChatbotLatency: (
                    this.results.chatbot.reduce((sum, r) => sum + r.latency, 0) / this.results.chatbot.length
                ).toFixed(2),
                cacheHitRate: this.results.cache.hitRate,
                averageAccuracy: this.results.accuracy.averageAccuracy,
            },
            detailed: this.results,
        };

        return report;
    }

    /**
     * Run all benchmarks
     */
    async runAll() {
        this.log('🚀 Starting DAVLibri Benchmark Suite\n');

        try {
            await this.benchmarkSearch();
            await this.delay(1000);

            await this.benchmarkChatbot();
            await this.delay(1000);

            await this.benchmarkCache();
            await this.delay(500);

            await this.benchmarkAccuracy();
            await this.delay(500);

            this.analyzeCosts();

            const report = this.generateReport();

            console.log('\n\n════════════════════════════════════════════════════════');
            console.log('📊 BENCHMARK REPORT');
            console.log('════════════════════════════════════════════════════════');
            console.log(JSON.stringify(report, null, 2));
            console.log('════════════════════════════════════════════════════════\n');

            return report;
        } catch (error) {
            this.log('❌ Benchmark suite failed', { error: error.message });
            process.exit(1);
        }
    }
}

// Run benchmarks
const suite = new BenchmarkSuite();
suite.runAll();
