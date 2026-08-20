/**
 * TEST VECTOR SEARCH
 *
 * Test semantic search functionality
 * Phục vụ CHƯƠNG 5.2.3 - Evaluation
 */

const mongoose = require('mongoose');
const { vectorSearch, explainVectorSearch } = require('../src/services/vectorSearch.service');
require('dotenv').config();

async function testVectorSearch() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!\n');

        const testQueries = [
            'sách về luật biển quốc tế',
            'kinh tế vĩ mô',
            'lập trình JavaScript',
            'văn học Việt Nam',
            'toán học giải tích',
        ];

        console.log('🧪 VECTOR SEARCH TEST');
        console.log('═'.repeat(60));

        for (const query of testQueries) {
            console.log(`\n🔍 Query: "${query}"`);
            console.log('─'.repeat(60));

            try {
                const results = await vectorSearch(query, { limit: 5 });

                if (results.length > 0) {
                    console.log('\n📚 Results:');
                    results.forEach((book, i) => {
                        console.log(`${i + 1}. ${book.nameProduct}`);
                        console.log(`   Author: ${book.author || 'N/A'}`);
                        console.log(`   Score: ${book.score?.toFixed(4) || 'N/A'}`);
                    });
                } else {
                    console.log('⚠️  No results found');
                }

                // Explain
                console.log('\n📋 Explanation:');
                const explain = await explainVectorSearch(query);
                console.log(`   Algorithm: ${explain.algorithmUsed}`);
                console.log(`   Similarity: ${explain.similarity}`);
                console.log(`   Dimensions: ${explain.dimensions}`);
                console.log(`   Results count: ${explain.resultsCount}`);
            } catch (error) {
                console.error(`❌ Error: ${error.message}`);
            }

            console.log('');
        }

        console.log('═'.repeat(60));
        console.log('✅ Test completed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

testVectorSearch();
