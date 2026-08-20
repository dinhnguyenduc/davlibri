const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./src/config/connectDB');
// Load models
require('./src/models/category.model');
require('./src/models/books.model');
const { askGeminiAI } = require('./src/utils/Chatbot/geminiAIWithRAG');

async function testCategoryList() {
    try {
        await connectDB();

        console.log('\n🧪 Testing Category List Feature\n');
        console.log('='.repeat(60));

        const testQueries = [
            'thư viện có những sách gì',
            'có những loại sách nào',
            'cho tôi biết danh mục sách',
            'các thể loại sách trong thư viện',
        ];

        for (const query of testQueries) {
            console.log(`\n📝 Test Query: "${query}"\n`);

            const result = await askGeminiAI(query);

            console.log('📊 Result:');
            console.log('  Source:', result.source);
            console.log('  Direct Answer:', result.directAnswer || false);

            if (result.categories) {
                console.log(`  Categories: ${result.categories.length}`);
                result.categories.forEach((cat, i) => {
                    console.log(`    ${i + 1}. ${cat.nameCategory}: ${cat.bookCount} cuốn`);
                });
            }

            console.log('\n  Answer Preview:');
            console.log('  ' + result.answer.substring(0, 150) + '...');
            console.log('\n' + '-'.repeat(60));
        }

        console.log('\n' + '='.repeat(60));

        const firstResult = await askGeminiAI(testQueries[0]);
        if (firstResult.source === 'categories' && firstResult.categories && firstResult.categories.length > 0) {
            console.log('✅ ALL TESTS PASSED - Category list feature works!');
        } else {
            console.log('❌ TEST FAILED - Expected source: "categories"');
            console.log('   Got source:', firstResult.source);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testCategoryList();
