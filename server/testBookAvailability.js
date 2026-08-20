const mongoose = require('mongoose');
require('dotenv').config();
const { askGeminiAI } = require('./src/utils/Chatbot/geminiAIWithRAG');

(async () => {
    try {
        console.log('🔬 TEST: Ask about book availability first\n');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const query = 'Có sách về Công ước Luật Biển 1982 không?';

        console.log(`📝 QUERY: "${query}"\n`);

        const result = await askGeminiAI(query);

        console.log('\n🎯 RESPONSE:');
        console.log(result.answer);
        console.log('\n📚 Source:', result.source);
        console.log('📖 Related books:', result.relatedBooks?.length || 0);

        if (result.relatedBooks && result.relatedBooks.length > 0) {
            console.log('\nTop 5 books:');
            result.relatedBooks.slice(0, 5).forEach((book, i) => {
                console.log(`${i + 1}. ${book.title}`);
            });
        }

        mongoose.connection.close();
        console.log('\n✅ Test complete');
    } catch (e) {
        console.error('❌ Error:', e.message);
        if (e.stack) console.error(e.stack);
        process.exit(1);
    }
})();
