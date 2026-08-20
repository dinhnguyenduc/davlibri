require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');

(async () => {
    try {
        console.log('🔄 Generating embeddings for both law books...\n');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

        const books = mongoose.connection.collection('books');

        // Process both books
        const isbns = ['978-604-2-30015-8', '978-604-2-30016-5'];
        const bookNames = ['UNCLOS 1982', 'Vietnam Maritime Law 2012'];

        for (let i = 0; i < isbns.length; i++) {
            const isbn = isbns[i];
            const bookName = bookNames[i];

            console.log(`\n📖 Processing ${bookName}...`);

            const book = await books.findOne({ isbn });

            if (!book) {
                console.log(`❌ ${bookName} not found (ISBN: ${isbn})!`);
                continue;
            }

            console.log('📚 Found book:', book.title);

            // Create text for embedding
            const text = [book.title, book.description, ...(book.keywords || [])].join(' ');

            console.log('📝 Text length:', text.length, 'characters');
            console.log('⚙️  Generating embeddings...');

            const result = await model.embedContent(text);
            const embeddings = result.embedding.values;

            console.log('✅ Generated embeddings:', embeddings.length, 'dimensions');

            // Update book with embeddings (use "embedding" singular, not "embeddings" plural)
            await books.updateOne({ _id: book._id }, { $set: { embedding: embeddings, updatedAt: new Date() } });

            console.log(`✅ Updated ${bookName} with embeddings`);
        }

        console.log('\n✨ Both books are now searchable via vector search!');

        mongoose.connection.close();
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
