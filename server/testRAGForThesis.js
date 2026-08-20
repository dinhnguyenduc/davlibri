const mongoose = require('mongoose');
require('dotenv').config();
const { askGeminiAI } = require('./src/utils/Chatbot/geminiAIWithRAG');

(async () => {
    try {
        console.log('🔬 TESTING RAG SYSTEM FOR THESIS DEMO (Figure 5.1)');
        console.log('='.repeat(70));

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Test query for thesis demo - Comparison query for Figure 5.1
        const testQuery =
            'So sánh quy định về Vùng đặc quyền kinh tế (EEZ) giữa Công ước Luật Biển 1982 và Luật Biển Việt Nam.';

        console.log('📝 TEST QUERY:');
        console.log(`   "${testQuery}"\n`);

        console.log('⏳ Calling RAG system...\n');

        const startTime = Date.now();
        const response = await askGeminiAI(testQuery, 'Hệ thống thư viện DAVLibri');
        const endTime = Date.now();

        // Extract answer text (handle both string and object responses)
        const answerText = typeof response === 'string' ? response : response.answer || JSON.stringify(response);

        console.log('✅ RAG RESPONSE:');
        console.log('─'.repeat(70));
        console.log(answerText);
        console.log('─'.repeat(70));

        console.log(`\n⏱️  Response time: ${endTime - startTime}ms`);

        // Validation checks for comparison query
        console.log('\n🔍 VALIDATION CHECKS FOR THESIS COMPARISON:');
        const checks = {
            'Contains "Công ước Luật Biển 1982" or "UNCLOS"':
                answerText.includes('Công ước') && (answerText.includes('1982') || answerText.includes('UNCLOS')),
            'Contains "Luật Biển Việt Nam"': answerText.includes('Luật Biển Việt Nam'),
            'Contains "Điều 57" (UNCLOS)': answerText.includes('Điều 57'),
            'Contains "Điều 15" (Vietnam Law)': answerText.includes('Điều 15'),
            'Contains "vùng đặc quyền kinh tế" or "EEZ"':
                answerText.includes('vùng đặc quyền kinh tế') || answerText.includes('EEZ'),
            'Contains citation "(Nguồn:"': answerText.includes('(Nguồn:'),
            'Contains location "Thư viện Luật"': answerText.includes('Thư viện Luật'),
            'Contains "200 hải lý"': answerText.includes('200 hải lý'),
        };

        let passedChecks = 0;
        Object.entries(checks).forEach(([check, passed]) => {
            console.log(`   ${passed ? '✅' : '❌'} ${check}`);
            if (passed) passedChecks++;
        });

        console.log(`\n📊 VALIDATION SCORE: ${passedChecks}/${Object.keys(checks).length}`);

        if (passedChecks >= 6) {
            console.log('🎉 PASSED! Response is suitable for thesis Figure 5.1');
        } else if (passedChecks >= 3) {
            console.log('⚠️  PARTIAL PASS - May need refinement');
        } else {
            console.log('❌ FAILED - Response does not meet thesis requirements');
        }

        console.log('\n💡 TIPS FOR THESIS SCREENSHOT:');
        console.log('   1. Use the response above in your chatbot interface');
        console.log('   2. Capture screenshot showing the citation format');
        console.log('   3. Highlight the source reference in the image');
        console.log('   4. Include in Figure 5.1 with caption explaining RAG with citations');

        mongoose.connection.close();
        process.exit(0);
    } catch (e) {
        console.error('\n❌ ERROR:', e.message);
        console.error(e);
        process.exit(1);
    }
})();
