/**
 * Migration script: Tạo text indexes cho Products và FAQs
 * Chạy script này 1 lần để tối ưu search performance
 *
 * Usage: node createTextIndexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function createIndexes() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // ========================================
        // 1. CREATE TEXT INDEX FOR PRODUCTS
        // ========================================
        console.log('\n📚 Creating text index for Products...');

        try {
            await db.collection('products').createIndex(
                {
                    nameProduct: 'text',
                    author: 'text',
                    description: 'text',
                    keywords: 'text',
                    publisher: 'text',
                },
                {
                    weights: {
                        nameProduct: 10, // Tên sách quan trọng nhất
                        author: 8, // Tác giả
                        keywords: 6, // Keywords
                        description: 3, // Mô tả
                        publisher: 2, // Nhà xuất bản
                    },
                    name: 'ProductSearchIndex',
                    default_language: 'none', // Không phân tích ngôn ngữ (tiếng Việt)
                },
            );
            console.log('✅ Products text index created successfully');
        } catch (error) {
            if (error.code === 85) {
                console.log('⚠️  Products text index already exists, dropping and recreating...');
                await db.collection('products').dropIndex('ProductSearchIndex');
                await db.collection('products').createIndex(
                    {
                        nameProduct: 'text',
                        author: 'text',
                        description: 'text',
                        keywords: 'text',
                        publisher: 'text',
                    },
                    {
                        weights: {
                            nameProduct: 10,
                            author: 8,
                            keywords: 6,
                            description: 3,
                            publisher: 2,
                        },
                        name: 'ProductSearchIndex',
                        default_language: 'none',
                    },
                );
                console.log('✅ Products text index recreated successfully');
            } else {
                throw error;
            }
        }

        // ========================================
        // 2. CREATE COMPOUND INDEXES FOR PRODUCTS
        // ========================================
        console.log('\n🔗 Creating compound indexes for Products...');

        await db.collection('products').createIndex({ stock: 1, viewCount: -1 }, { name: 'stock_viewCount' });
        console.log('✅ Index created: stock + viewCount');

        await db.collection('products').createIndex({ category: 1, rentCount: -1 }, { name: 'category_rentCount' });
        console.log('✅ Index created: category + rentCount');

        await db.collection('products').createIndex({ author: 1 }, { name: 'author_index' });
        console.log('✅ Index created: author');

        // ========================================
        // 3. CREATE TEXT INDEX FOR FAQS
        // ========================================
        console.log('\n❓ Creating text index for FAQs...');

        try {
            await db.collection('faqs').createIndex(
                {
                    question: 'text',
                    answer: 'text',
                    keywords: 'text',
                },
                {
                    weights: {
                        question: 10,
                        keywords: 5,
                        answer: 2,
                    },
                    name: 'FAQSearchIndex',
                    default_language: 'none',
                },
            );
            console.log('✅ FAQs text index created successfully');
        } catch (error) {
            if (error.code === 85) {
                console.log('⚠️  FAQs text index already exists, skipping...');
            } else {
                throw error;
            }
        }

        // ========================================
        // 4. LIST ALL INDEXES
        // ========================================
        console.log('\n📋 Listing all indexes:');

        const productIndexes = await db.collection('products').indexes();
        console.log('\n📚 Products indexes:');
        productIndexes.forEach((idx) => {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        const faqIndexes = await db.collection('faqs').indexes();
        console.log('\n❓ FAQs indexes:');
        faqIndexes.forEach((idx) => {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        console.log('\n✅ All indexes created successfully!');
        console.log('\n💡 Tip: Run this script again if you add new fields to search');
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run
createIndexes();
