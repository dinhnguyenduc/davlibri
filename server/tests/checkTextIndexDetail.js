const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./src/config/connectDB');

async function checkTextIndexDetail() {
    try {
        await connectDB();

        const db = mongoose.connection.db;
        const productsIndexes = await db.collection('products').indexes();

        console.log('\n📦 Products Collection - All Indexes:\n');

        productsIndexes.forEach((idx, i) => {
            console.log(`${i + 1}. Index: ${idx.name}`);
            console.log(`   Key: ${JSON.stringify(idx.key, null, 2)}`);
            if (idx.weights) {
                console.log(`   Weights: ${JSON.stringify(idx.weights, null, 2)}`);
            }
            if (idx.default_language) {
                console.log(`   Language: ${idx.default_language}`);
            }
            console.log('');
        });

        // Find text index
        const textIndex = productsIndexes.find((idx) => idx.key._fts === 'text');

        if (textIndex) {
            console.log('✅ Text Index Found: ' + textIndex.name);
            console.log('   Fields with weights:');
            if (textIndex.weights) {
                Object.keys(textIndex.weights).forEach((field) => {
                    console.log(`   - ${field}: ${textIndex.weights[field]}`);
                });
            }
        } else {
            console.log('❌ NO TEXT INDEX FOUND!');
        }

        // Test text search
        console.log('\n🧪 Testing text search with "chính trị quốc tế"...\n');

        const result = await db
            .collection('products')
            .find({ $text: { $search: 'chính trị quốc tế' } }, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .limit(3)
            .toArray();

        console.log(`   Found ${result.length} results:`);
        result.forEach((book, i) => {
            console.log(`   ${i + 1}. ${book.nameProduct || book.name} (Score: ${book.score})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkTextIndexDetail();
