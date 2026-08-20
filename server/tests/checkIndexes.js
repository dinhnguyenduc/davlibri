const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./src/config/connectDB');

async function checkIndexes() {
    try {
        await connectDB();

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        console.log('\n🔍 Checking all indexes:\n');

        for (const collection of collections) {
            const collName = collection.name;
            const indexes = await db.collection(collName).indexes();

            console.log(`📦 Collection: ${collName}`);
            console.log(`   Indexes (${indexes.length}):`);
            indexes.forEach((idx, i) => {
                console.log(`   ${i + 1}. ${idx.name}: ${JSON.stringify(idx.key)}`);
            });
            console.log('');
        }

        // Specifically check products text index
        const productsIndexes = await db.collection('products').indexes();
        const hasTextIndex = productsIndexes.some((idx) => idx.name && idx.name.includes('text'));

        if (!hasTextIndex) {
            console.log('⚠️  WARNING: Products collection DOES NOT have text index!');
            console.log('   Solution: Run: node server/createTextIndexes.js\n');
        } else {
            console.log('✅ Products collection has text index\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkIndexes();
