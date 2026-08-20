require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('All collections:');
        collections.forEach((c) => console.log('-', c.name));

        console.log('\nSearching for chatbot policy...\n');

        // Try different collection names
        const names = ['chatbotpolicies', 'chatbotPolicies', 'chatbotpolicy', 'policies'];

        for (const name of names) {
            try {
                const coll = mongoose.connection.collection(name);
                const count = await coll.countDocuments();
                console.log(`${name}: ${count} documents`);

                if (count > 0) {
                    const docs = await coll.find({}).toArray();
                    docs.forEach((doc) => {
                        console.log(`  - ${doc.name} (active: ${doc.isActive})`);
                    });
                }
            } catch (e) {
                console.log(`${name}: not found`);
            }
        }

        mongoose.connection.close();
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
