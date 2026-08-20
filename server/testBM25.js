require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./src/models/books.model');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const query = 't├ái liß╗çu công ước luật biển và quy định thềm lục địa';
        console.log('📊 BM25 Search for:', query);
        console.log('─'.repeat(70) + '\n');

        // Try different search variations
        const searches = [
            'UNCLOS luật biển thềm lục địa',
            'Công ước Luật Biển 1982',
            'tài liệu công ước luật biển',
            query,
        ];

        for (const searchQuery of searches) {
            console.log('\n🔍 Query:', searchQuery);

            const results = await Book.find({
                $text: { $search: searchQuery },
                availableCopies: { $gt: 0 },
            })
                .select('title isbn availableCopies')
                .limit(5)
                .lean();

            console.log(`   Found: ${results.length} books`);
            results.forEach((b, i) => {
                const isUNCLOS = b.isbn === '978-604-2-30015-8';
                console.log(`   ${i + 1}. ${b.title} ${isUNCLOS ? '✅ UNCLOS' : ''}`);
            });
        }

        process.exit();
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
