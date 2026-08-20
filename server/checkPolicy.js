require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const policies = mongoose.connection.collection('chatbotpolicies');
        const allPolicies = await policies.find({}).toArray();

        console.log(`Found ${allPolicies.length} total policies\n`);

        allPolicies.forEach((policy, i) => {
            console.log(`${i + 1}. ${policy.name}`);
            console.log(`   Active: ${policy.isActive}`);
            console.log(`   Priority: ${policy.priority}`);
            if (policy.rules?.scopeLimitation) {
                console.log(`   Scope enabled: ${policy.rules.scopeLimitation.enabled}`);
                console.log(`   Allowed topics: ${policy.rules.scopeLimitation.allowedTopics?.join(', ')}`);
            }
            console.log();
        });

        const activePolicy = await policies.findOne({ isActive: true });

        if (!activePolicy) {
            console.log('❌ No active policy found');
        } else {
            console.log('📋 Active Chatbot Policy:\n');
            console.log('Policy Name:', activePolicy.name);
            console.log('Priority:', activePolicy.priority);
            console.log('\n🔒 Scope Limitation:');
            console.log('  Enabled:', activePolicy.rules.scopeLimitation.enabled);
            console.log('  Allowed Topics:', activePolicy.rules.scopeLimitation.allowedTopics);
            console.log('  Rejection Message:', activePolicy.rules.scopeLimitation.rejectionMessage);
        }

        mongoose.connection.close();
    } catch (e) {
        console.error('❌ Error:', e.message);
        process.exit(1);
    }
})();
