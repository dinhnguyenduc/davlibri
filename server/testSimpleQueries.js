const mongoose = require('mongoose');
require('dotenv').config();
const { askGeminiAI } = require('./src/utils/Chatbot/geminiAIWithRAG');

(async () => {
    try {
        console.log('🔬 SIMPLE TEST: Ask about UNCLOS directly\n');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const queries = [
            'Công ước Luật Biển 1982 quy định về vùng đặc quyền kinh tế EEZ',
            'Điều 57 UNCLOS quy định gì',
            'Luật Biển Việt Nam quy định về EEZ như thế nào',
        ];

        for (const query of queries) {
            console.log('\n' + '='.repeat(80));
            console.log(`📝 QUERY: "${query}"`);
            console.log('='.repeat(80));

            const result = await askGeminiAI(query);

            console.log('\n🎯 RESPONSE:');
            console.log(result.answer);
            console.log('\n📚 Source:', result.source);
            console.log('📖 Related books:', result.relatedBooks?.length || 0);

            if (result.relatedBooks && result.relatedBooks.length > 0) {
                console.log('\nTop 3 books:');
                result.relatedBooks.slice(0, 3).forEach((book, i) => {
                    console.log(`${i + 1}. ${book.title}`);
                });
            }

            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s between queries
        }

        mongoose.connection.close();
        console.log('\n✅ Test complete');
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
