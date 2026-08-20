/**
 * COMPARE SEARCH METHODS
 *
 * So sánh BM25 vs Vector vs Hybrid Search
 * Phục vụ CHƯƠNG 5.2.3 - Performance Evaluation
 */

const mongoose = require('mongoose');
const { compareSearchMethods } = require('../src/services/hybridSearch.service');
require('dotenv').config();

async function testCompareSearch() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!\n');

        const query = process.argv[2] || 'sách về kinh tế và quản lý';

        console.log('🔬 SEARCH METHODS COMPARISON');
        console.log('═'.repeat(60));
        console.log(`Query: "${query}"`);
        console.log('═'.repeat(60));

        const comparison = await compareSearchMethods(query);

        console.log('\n📊 BM25 (Text Search):');
        console.log('─'.repeat(60));
        console.log(`Count: ${comparison.bm25.count}`);
        console.log('\nTop 5:');
        comparison.bm25.top5.forEach((title, i) => {
            console.log(`${i + 1}. ${title}`);
        });

        console.log('\n📊 VECTOR (Semantic Search):');
        console.log('─'.repeat(60));
        console.log(`Count: ${comparison.vector.count}`);
        console.log('\nTop 5:');
        comparison.vector.top5.forEach((title, i) => {
            console.log(`${i + 1}. ${title}`);
        });

        console.log('\n📊 HYBRID (BM25 + Vector):');
        console.log('─'.repeat(60));
        console.log(`Count: ${comparison.hybrid.count}`);
        console.log(`Found by both methods: ${comparison.hybrid.bothMethods}`);
        console.log('\nTop 5:');
        comparison.hybrid.top5.forEach((title, i) => {
            console.log(`${i + 1}. ${title}`);
        });

        console.log('\n═'.repeat(60));
        console.log('📝 ANALYSIS:');
        console.log('─'.repeat(60));
        console.log(`Unique to BM25: ${comparison.bm25.count - comparison.hybrid.bothMethods}`);
        console.log(`Unique to Vector: ${comparison.vector.count - comparison.hybrid.bothMethods}`);
        console.log(`Overlap (found by both): ${comparison.hybrid.bothMethods}`);
        console.log(`\nHybrid advantage: Combines best of both methods`);
        console.log(`  - BM25: Good for exact keyword matches`);
        console.log(`  - Vector: Good for semantic/conceptual matches`);
        console.log(`  - Hybrid: Captures both types of relevance`);

        console.log('\n═'.repeat(60));
        console.log('✅ Comparison completed!');
        console.log('\n💡 Try different queries:');
        console.log('   node scripts/compareSearch.js "luật biển quốc tế"');
        console.log('   node scripts/compareSearch.js "lập trình web"');
        console.log('   node scripts/compareSearch.js "văn học cổ điển"');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

testCompareSearch();
