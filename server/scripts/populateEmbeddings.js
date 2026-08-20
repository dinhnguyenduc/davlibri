/**
 * POPULATE BOOK EMBEDDINGS SCRIPT
 *
 * Generate vector embeddings for all books in the database
 * using Google Gemini text-embedding-004 model (768 dimensions).
 *
 * Purpose:
 * - Fetches all books from MongoDB books collection
 * - Generates semantic embeddings based on: title, author, description, ISBN, publisher
 * - Updates each book document with the generated embedding
 * - Enables Vector Search functionality (CHƯƠNG 3.3.2)
 *
 * Usage: node scripts/populateEmbeddings.js
 *
 * Prerequisites:
 * - GEMINI_API_KEY must be set in .env
 * - MongoDB connection must be available
 * - Books collection must exist with data
 */

const mongoose = require('mongoose');
const Book = require('../src/models/books.model');
const { generateEmbedding, prepareBookText, EMBEDDING_MODEL } = require('../src/services/embedding.service');
require('dotenv').config();

async function populateEmbeddings() {
    try {
        // Connect to MongoDB
        console.log('\n' + '='.repeat(60));
        console.log('🚀 BOOK EMBEDDINGS POPULATION SCRIPT');
        console.log('='.repeat(60));
        console.log(`Model: ${EMBEDDING_MODEL} (768 dimensions)`);
        console.log('Database:', process.env.MONGO_URI?.split('@')[1]?.split('/')[0] || 'Unknown');
        console.log('='.repeat(60));
        console.log('\n🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!\n');

        // Find books without embeddings or with outdated embeddings
        const books = await Book.find({
            $or: [
                { embedding: { $exists: false } },
                { embedding: null },
                { 'embeddingMetadata.model': { $ne: EMBEDDING_MODEL } }, // Re-generate if model changed
            ],
        }).select('_id title author description isbn publisher category keywords');

        console.log(`📚 Found ${books.length} books to process\n`);

        if (books.length === 0) {
            console.log('✅ All books already have embeddings!');
            console.log('\n💡 Next steps:');
            console.log('   1. Run: npm run test:vector');
            console.log('   2. Test hybrid search: npm run test:hybrid\n');
            await mongoose.connection.close();
            process.exit(0);
        }

        let successCount = 0;
        let failedCount = 0;
        const errors = [];

        for (let i = 0; i < books.length; i++) {
            const book = books[i];

            console.log(`\n[${i + 1}/${books.length}] Processing: "${book.title}"`);
            console.log('   Author:', book.author || 'N/A');
            console.log('─'.repeat(60));

            try {
                // Prepare text for embedding
                const textToEmbed = prepareBookText(book);
                console.log(`   📝 Text length: ${textToEmbed.length} chars`);

                // Generate embedding
                console.log('   🔄 Generating embedding...');
                const startTime = Date.now();
                const embedding = await generateEmbedding(textToEmbed);
                const duration = Date.now() - startTime;

                // Validate embedding
                if (!embedding || embedding.length !== 768) {
                    throw new Error(`Invalid embedding dimensions: ${embedding?.length || 0}`);
                }

                // Update database
                await Book.findByIdAndUpdate(book._id, {
                    embedding: embedding,
                    embeddingMetadata: {
                        model: EMBEDDING_MODEL,
                        generatedAt: new Date(),
                        textUsed: textToEmbed.substring(0, 500), // Store first 500 chars for reference
                        dimensions: embedding.length,
                    },
                });

                console.log(`   ✅ Success! (${duration}ms, ${embedding.length} dims)`);
                successCount++;

                // Rate limiting: 150ms delay = ~6-7 requests/second
                if (i < books.length - 1) {
                    console.log('   ⏱️  Waiting 150ms (rate limiting)...');
                    await new Promise((resolve) => setTimeout(resolve, 150));
                }
            } catch (error) {
                console.error(`   ❌ Failed: ${error.message}`);
                failedCount++;
                errors.push({
                    bookId: book._id,
                    title: book.title,
                    error: error.message,
                });

                // Continue with next book
                continue;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 EMBEDDING POPULATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total books:     ${books.length}`);
        console.log(`✅ Successful:   ${successCount}`);
        console.log(`❌ Failed:       ${failedCount}`);
        console.log(`📈 Success rate: ${((successCount / books.length) * 100).toFixed(1)}%`);

        if (errors.length > 0) {
            console.log('\n⚠️  Failed Books:');
            errors.forEach((err, idx) => {
                console.log(`   ${idx + 1}. "${err.title}" (${err.bookId})`);
                console.log(`      Error: ${err.error}`);
            });
        }

        console.log('\n' + '='.repeat(60));

        if (successCount === books.length) {
            console.log('🎉 All embeddings generated successfully!');
            console.log('\n💡 Next steps:');
            console.log('   1. Verify Vector Search Index exists in MongoDB Atlas');
            console.log('   2. Run: npm run test:vector');
            console.log('   3. Test hybrid search: npm run test:hybrid');
        } else if (successCount > 0) {
            console.log('⚠️  Some embeddings failed. You can re-run this script to retry.');
        } else {
            console.log('❌ No embeddings were generated. Please check:');
            console.log('   1. GEMINI_API_KEY is valid');
            console.log('   2. Books have title, author, description');
            console.log('   3. API rate limits');
        }

        await mongoose.connection.close();
        console.log('\n✅ MongoDB connection closed');
        console.log('✨ Script completed\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run
populateEmbeddings();
