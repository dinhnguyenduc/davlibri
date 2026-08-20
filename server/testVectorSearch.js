require('dotenv').config();
const mongoose = require('mongoose');
const { vectorSearch } = require('./src/services/vectorSearch.service');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const query = 'tài liệu công ước luật biển và quy định thềm lục địa';
        console.log('🔍 Vector Search for:', query);
        console.log('─'.repeat(70) + '\n');

        const results = await vectorSearch(query, { limit: 20 });

        console.log(`📊 Found: ${results.length} results`);
        console.log('─'.repeat(70));

        results.forEach((book, i) => {
            const isUNCLOS = book.isbn === '978-604-2-30015-8';
            console.log(`\n${i + 1}. ${book.title} ${isUNCLOS ? '✅✅✅ UNCLOS' : ''}`);
            console.log(`   Vector Score: ${book.vectorScore.toFixed(4)}`);
            console.log(`   ISBN: ${book.isbn}`);
        });

        //Find UNCLOS position
        const unclosIndex = results.findIndex((b) => b.isbn === '978-604-2-30015-8');
        console.log('\n' + '='.repeat(70));
        console.log(`📍 UNCLOS POSITION: ${unclosIndex >= 0 ? `#${unclosIndex + 1}` : 'NOT FOUND'}`);

        process.exit();
    } catch (e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
