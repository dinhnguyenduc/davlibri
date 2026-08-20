require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const books = mongoose.connection.collection('books');

        // Test 1: Find both law books directly
        console.log('📋 TEST 1: Direct database query for law books\n');
        const lawBooks = await books
            .find({
                $or: [{ isbn: '978-604-2-30015-8' }, { isbn: '978-604-2-30016-5' }],
            })
            .toArray();

        console.log(`Found ${lawBooks.length} law books:`);
        lawBooks.forEach((book, i) => {
            console.log(`${i + 1}. ${book.title}`);
            console.log(`   ISBN: ${book.isbn}`);
            console.log(`   Location: ${book.location}`);
            console.log(`   Has embedding: ${!!book.embedding}`);
            console.log(`   Embedding dims: ${book.embedding ? book.embedding.length : 0}`);
            console.log(`   Keywords: ${(book.keywords || []).slice(0, 5).join(', ')}`);
            console.log();
        });

        // Test 2: Vector search for "vùng đặc quyền kinh tế"
        console.log('📋 TEST 2: Vector search for "vùng đặc quyền kinh tế EEZ"\n');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

        const query = 'vùng đặc quyền kinh tế EEZ Điều 57 Điều 15';
        console.log(`Query: "${query}"`);

        const result = await model.embedContent(query);
        const queryEmbedding = result.embedding.values;
        console.log(`✅ Generated query embedding: ${queryEmbedding.length} dims\n`);

        const vectorResults = await books
            .aggregate([
                {
                    $vectorSearch: {
                        index: 'vector_index',
                        path: 'embedding',
                        queryVector: queryEmbedding,
                        numCandidates: 100,
                        limit: 20,
                    },
                },
                {
                    $project: {
                        title: 1,
                        isbn: 1,
                        location: 1,
                        score: { $meta: 'vectorSearchScore' },
                    },
                },
            ])
            .toArray();

        console.log(`Found ${vectorResults.length} results:\n`);
        vectorResults.slice(0, 10).forEach((book, i) => {
            console.log(`${i + 1}. ${book.title}`);
            console.log(`   Score: ${book.score.toFixed(4)}`);
            console.log(`   ISBN: ${book.isbn}`);
            console.log();
        });

        // Test 3: Text search
        console.log('📋 TEST 3: Text search for "luật biển"\n');

        const textResults = await books
            .find({ $text: { $search: 'luật biển EEZ' } }, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .limit(10)
            .toArray();

        console.log(`Found ${textResults.length} results:\n`);
        textResults.forEach((book, i) => {
            console.log(`${i + 1}. ${book.title}`);
            console.log(`   Score: ${book.score.toFixed(4)}`);
            console.log(`   ISBN: ${book.isbn}`);
            console.log();
        });

        mongoose.connection.close();
    } catch (e) {
        console.error('❌ Error:', e.message);
        if (e.stack) console.error(e.stack);
        process.exit(1);
    }
})();
