require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const policies = mongoose.connection.collection('chatbotPolicies');

        // Update allowedTopics to include content-related terms
        const result = await policies.updateOne(
            { isActive: true },
            {
                $set: {
                    'rules.scopeLimitation.allowedTopics': [
                        'sách',
                        'thư viện',
                        'học thuật',
                        'tra cứu',
                        'thủ tục',
                        'thuê sách',
                        'trả sách',
                        'thanh toán',
                        // Add content-related terms
                        'nội dung',
                        'điều',
                        'quy định',
                        'luật',
                        'chính sách',
                        'công ước',
                        'hiệp định',
                        'văn bản',
                        'tài liệu',
                        'so sánh',
                        'phân tích',
                        'nghiên cứu',
                    ],
                },
            },
        );

        console.log('✅ Updated policy:', result.modifiedCount, 'document(s)');

        // Verify
        const updated = await policies.findOne({ isActive: true });
        console.log('\nUpdated allowedTopics:');
        updated.rules.scopeLimitation.allowedTopics.forEach((topic, i) => {
            console.log(`${i + 1}. ${topic}`);
        });

        mongoose.connection.close();
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
