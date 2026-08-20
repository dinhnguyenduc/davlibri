/**
 * Script: Rebuild Text Index for FAQ Collection
 * ----------------------------------------------
 * Mục đích: Đảm bảo text search hoạt động tốt cho 100 FAQs mới
 */

const mongoose = require('mongoose');
require('dotenv').config();

const FAQ = require('./src/models/faq.model');

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

async function rebuildTextIndex() {
    try {
        console.log('\n🔧 Rebuilding FAQ text indexes...\n');

        // Drop existing text index
        try {
            await FAQ.collection.dropIndex('question_text_keywords_text_answer_text');
            console.log('✅ Dropped old text index');
        } catch (err) {
            console.log('⚠️  No old index to drop (this is OK)');
        }

        // Create new text index
        await FAQ.collection.createIndex(
            {
                question: 'text',
                keywords: 'text',
                answer: 'text',
                source_ref: 'text',
                topic: 'text',
            },
            {
                weights: {
                    question: 10,
                    keywords: 5,
                    source_ref: 3,
                    topic: 2,
                    answer: 1,
                },
                name: 'faq_full_text_search',
            },
        );

        console.log('✅ Created new text index with enhanced fields');

        // Test the index
        console.log('\n🧪 Testing text search...');

        const testQueries = ['Quyết định 508', 'điểm F học phần bắt buộc', 'Học viện Ngoại giao'];

        for (const query of testQueries) {
            const results = await FAQ.find({
                $text: { $search: query },
            }).limit(3);

            console.log(`\n   Query: "${query}"`);
            console.log(`   Results: ${results.length} FAQs found`);

            if (results.length > 0) {
                console.log(`   ✅ Top match: "${results[0].question.substring(0, 80)}..."`);
            }
        }

        console.log('\n✨ Index rebuild completed successfully!\n');
    } catch (error) {
        console.error('\n❌ Error rebuilding index:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

rebuildTextIndex();
