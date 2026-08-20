require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const books = mongoose.connection.collection('books');

        const unclos = await books.findOne({ isbn: '978-604-2-30015-8' });

        if (!unclos.embeddings) {
            console.log('❌ UNCLOS has no embeddings to copy');
            process.exit(1);
        }

        await books.updateOne(
            { _id: unclos._id },
            {
                $set: { embedding: unclos.embeddings },
                $unset: { embeddings: 1 },
            },
        );

        console.log('✅ Renamed "embeddings" → "embedding" for UNCLOS');
        console.log('📊 Vector dimension:', unclos.embeddings.length);

        // Verify
        const updated = await books.findOne({ isbn: '978-604-2-30015-8' });
        console.log('\n✅ Verification:');
        console.log('   Has "embedding":', !!updated.embedding);
        console.log('   Has "embeddings":', !!updated.embeddings);

        process.exit();
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
