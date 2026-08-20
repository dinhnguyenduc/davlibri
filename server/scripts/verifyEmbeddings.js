/**
 * VERIFY EMBEDDINGS SCRIPT
 *
 * Kiểm tra coverage của embeddings trong database
 * Phục vụ testing và validation - CHƯƠNG 5.2.3
 */

const mongoose = require('mongoose');
const Book = require('../src/models/books.model');
require('dotenv').config();

async function verifyEmbeddings() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!\n');

        // Get stats
        const total = await Book.countDocuments();
        const withEmbedding = await Book.countDocuments({
            embedding: { $exists: true, $ne: null },
        });
        const withMetadata = await Book.countDocuments({
            'embeddingMetadata.generatedAt': { $exists: true },
        });

        console.log('📊 EMBEDDING COVERAGE:');
        console.log('═'.repeat(60));
        console.log(`Total books: ${total}`);
        console.log(`With embedding: ${withEmbedding}`);
        console.log(`With metadata: ${withMetadata}`);
        console.log(`Coverage: ${((withEmbedding / total) * 100).toFixed(1)}%`);

        if (withEmbedding > 0) {
            // Sample embedding
            const sample = await Book.findOne({ embedding: { $exists: true } }).select(
                'nameProduct embedding embeddingMetadata',
            );

            console.log('\n✅ SAMPLE EMBEDDING:');
            console.log('─'.repeat(60));
            console.log(`Book: ${sample.nameProduct}`);
            console.log(`Dimensions: ${sample.embedding.length}`);
            console.log(
                `First 5 values: [${sample.embedding
                    .slice(0, 5)
                    .map((v) => v.toFixed(4))
                    .join(', ')}...]`,
            );
            console.log(`Model: ${sample.embeddingMetadata?.model || 'N/A'}`);
            console.log(`Generated: ${sample.embeddingMetadata?.generatedAt || 'N/A'}`);

            // Check for invalid embeddings
            const invalid = await Book.countDocuments({
                embedding: { $exists: true },
                $expr: { $ne: [{ $size: '$embedding' }, 768] },
            });

            if (invalid > 0) {
                console.log(`\n⚠️  WARNING: ${invalid} books have invalid embedding dimensions!`);
            } else {
                console.log('\n✅ All embeddings have correct dimensions (768)');
            }
        } else {
            console.log('\n⚠️  No embeddings found! Run: npm run embed:populate');
        }

        // Books without embeddings
        if (withEmbedding < total) {
            console.log(`\n📋 MISSING EMBEDDINGS:`);
            console.log('─'.repeat(60));
            const missing = await Book.find({
                $or: [{ embedding: { $exists: false } }, { embedding: null }],
            })
                .select('nameProduct')
                .limit(5)
                .lean();

            missing.forEach((book, i) => {
                console.log(`${i + 1}. ${book.nameProduct}`);
            });

            if (total - withEmbedding > 5) {
                console.log(`... and ${total - withEmbedding - 5} more`);
            }

            console.log(`\n💡 To generate missing embeddings, run: npm run embed:populate`);
        }

        console.log('\n' + '═'.repeat(60));
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

verifyEmbeddings();
