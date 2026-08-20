const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./src/config/connectDB');
// Load all models to register schemas
require('./src/models/category.model');
require('./src/models/books.model');
const { askGeminiAI } = require('./src/utils/Chatbot/geminiAIWithRAG');

async function testE2ECalculation() {
    try {
        await connectDB();

        console.log('\n🧪 Testing End-to-End Calculation Flow\n');
        console.log('='.repeat(60));

        const testQuery = 'sách chính trị quốc tế hiện đại thuê hết bao nhiêu tiền 5 ngày';

        console.log(`\n📝 Test Query: "${testQuery}"\n`);

        const result = await askGeminiAI(testQuery);

        console.log('\n📊 Result:\n');
        console.log('Answer Source:', result.source);
        console.log('Direct Answer:', result.directAnswer || false);
        console.log('\nAnswer Text:');
        console.log(result.answer);

        if (result.calculation) {
            console.log('\n💰 Calculation Details:');
            console.log(JSON.stringify(result.calculation, null, 2));
        }

        if (result.relatedBooks) {
            console.log('\n📚 Related Books:');
            result.relatedBooks.forEach((book, i) => {
                console.log(`${i + 1}. ${book.name || book.nameProduct} - ${book.price}đ`);
            });
        }

        console.log('\n' + '='.repeat(60));

        if (result.source === 'calculation' && result.directAnswer) {
            console.log('✅ TEST PASSED - Calculation feature works!');
        } else {
            console.log('❌ TEST FAILED - Calculation feature not triggered');
            console.log('   Expected source: "calculation", got:', result.source);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testE2ECalculation();
