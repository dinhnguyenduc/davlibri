require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const books = mongoose.connection.collection('books');

        // Check a sample book with embeddings
        const sample = await books.findOne(
            { embeddings: { $exists: true } },
            { projection: { title: 1, embedding: 1, embeddings: 1 } },
        );

        console.log('Sample book:', sample.title);
        console.log('Has "embedding" (singular):', !!sample.embedding);
        console.log('Has "embeddings" (plural):', !!sample.embeddings);

        // Check UNCLOS
        const unclos = await books.findOne(
            { isbn: '978-604-2-30015-8' },
            { projection: { title: 1, embedding: 1, embeddings: 1 } },
        );

        console.log('\nUNCLOS:');
        console.log('Has "embedding" (singular):', !!unclos.embedding);
        console.log('Has "embeddings" (plural):', !!unclos.embeddings);

        process.exit();
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
})();
