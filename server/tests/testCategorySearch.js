const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./src/config/connectDB');
// Load models
require('./src/models/category.model');
require('./src/models/books.model');
const { askGeminiAI } = require('./src/utils/Chatbot/geminiAIWithRAG');

async function testCategorySearch() {
    try {
        await connectDB();

        console.log('\n🧪 Testing Category Search Feature\n');
        console.log('='.repeat(70));

        const testQueries = [
            'Tìm sách về Luật quốc tế',
            'có những sách nào trong danh mục Quan hệ quốc tế',
            'sách về Kinh tế quốc tế',
            'cho tôi xem sách Truyền thông văn hóa',
        ];

        for (const query of testQueries) {
            console.log(`\n📝 Test Query: "${query}"\n`);

            const result = await askGeminiAI(query);

            console.log('📊 Result:');
            console.log('  Source:', result.source);
            console.log('  Direct Answer:', result.directAnswer || false);

            if (result.categoryFilter) {
                console.log(`  Category Filter: "${result.categoryFilter}"`);
            }

            if (result.relatedBooks) {
                console.log(`  Books Found: ${result.relatedBooks.length}`);
                result.relatedBooks.forEach((book, i) => {
                    console.log(`    ${i + 1}. ${book.name || book.nameProduct} - ${book.price}đ/ngày`);
                });
            }

            console.log('\n  Answer Preview:');
            const preview = result.answer.substring(0, 200).replace(/\n/g, '\n  ');
            console.log('  ' + preview + '...');
            console.log('\n' + '-'.repeat(70));
        }

        console.log('\n' + '='.repeat(70));

        const firstResult = await askGeminiAI(testQueries[0]);
        if (
            firstResult.source === 'category-search' &&
            firstResult.relatedBooks &&
            firstResult.relatedBooks.length > 0
        ) {
            console.log('✅ ALL TESTS PASSED - Category search feature works!');
            console.log(
                `   Found ${firstResult.relatedBooks.length} books in category "${firstResult.categoryFilter}"`,
            );
        } else {
            console.log('❌ TEST FAILED');
            console.log('   Expected source: "category-search"');
            console.log('   Got source:', firstResult.source);
            console.log('   Books found:', firstResult.relatedBooks?.length || 0);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testCategorySearch();
