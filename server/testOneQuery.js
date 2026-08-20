const mongoose = require('mongoose');
require('dotenv').config();
const { askGeminiAI } = require('./src/utils/Chatbot/geminiAIWithRAG');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const query = 'Điều 57 UNCLOS quy định gì';

        console.log(`📝 QUERY: "${query}"\n`);

        const result = await askGeminiAI(query);

        console.log('\n🎯 FINAL RESPONSE:');
        console.log(result.answer);
        console.log('\n📚 Source:', result.source);
        console.log('📖 Related books count:', result.relatedBooks?.length || 0);

        if (result.relatedBooks && result.relatedBooks.length > 0) {
            console.log('\nTop 3 books:');
            result.relatedBooks.slice(0, 3).forEach((book, i) => {
                console.log(`${i + 1}. ${book.title} - ${book.location || 'No location'}`);
            });
        }

        mongoose.connection.close();
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
