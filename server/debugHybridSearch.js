require('dotenv').config();
const mongoose = require('mongoose');
const { hybridSearch } = require('./src/services/hybridSearch.service');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const query = 'tài liệu công ước luật biển và quy định thềm lục địa';
        console.log('🔍 Searching for:', query);
        console.log('─'.repeat(70) + '\n');

        const results = await hybridSearch(query, 20); // Get top 20

        console.log('📊 SEARCH RESULTS:', results.length);
        console.log('─'.repeat(70));

        results.slice(0, 10).forEach((book, i) => {
            console.log(`\n${i + 1}. ${book.title}`);
            console.log(`   Author: ${book.author}`);
            console.log(`   ISBN: ${book.isbn}`);
            console.log(`   Location: ${book.location || 'N/A'}`);
            console.log(`   Keywords: ${(book.keywords || []).join(', ')}`);
        });

        // Check if UNCLOS is in the results
        const unclosIndex = results.findIndex((b) => b.isbn === '978-604-2-30015-8');
        console.log('\n' + '─'.repeat(70));
        console.log(`📍 UNCLOS position: ${unclosIndex >= 0 ? `#${unclosIndex + 1}` : 'NOT FOUND'}`);

        if (unclosIndex >= 0) {
            console.log('\n✅ UNCLOS FOUND:');
            const unclos = results[unclosIndex];
            console.log(`   Title: ${unclos.title}`);
            console.log(`   Location: ${unclos.location}`);
            console.log(`   Keywords: ${(unclos.keywords || []).join(', ')}`);
        }

        process.exit();
    } catch (e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
