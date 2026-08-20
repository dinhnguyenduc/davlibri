require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const books = mongoose.connection.collection('books');

        console.log('Testing text search for UNCLOS...\n');

        // Test 1: Direct text search
        const textResults = await books
            .find({ $text: { $search: 'UNCLOS luật biển thềm lục địa' } }, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .limit(10)
            .toArray();

        console.log('📊 Text Search Results:', textResults.length);
        textResults.forEach((b, i) => {
            console.log(`   ${i + 1}. ${b.title}`);
            if (b.score) console.log(`      Score: ${b.score.toFixed(2)}`);
            console.log(`      ISBN: ${b.isbn}`);
        });

        // Test 2: Simple keyword search
        console.log('\n📊 Keyword Search (title/description contains "UNCLOS"):');
        const keywordResults = await books
            .find({
                $or: [{ title: /UNCLOS/i }, { description: /UNCLOS/i }, { keywords: 'UNCLOS' }],
            })
            .toArray();

        console.log('   Found:', keywordResults.length);
        keywordResults.forEach((b) => {
            console.log(`   - ${b.title} (ISBN: ${b.isbn})`);
        });

        process.exit();
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
})();
