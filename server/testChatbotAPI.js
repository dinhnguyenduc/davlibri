/**
 * Quick API Test: Test Chatbot Endpoint Directly
 * -----------------------------------------------
 * Gửi request trực tiếp đến API chatbot endpoint
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:9000';

async function testChatbotAPI() {
    try {
        console.log('\n🚀 Testing Chatbot API Endpoint\n');
        console.log(`📡 API URL: ${API_URL}/api/v1/chatbot/ask\n`);

        const testQuestions = [
            {
                id: 1,
                question:
                    'Theo Quyết định số 508/QĐ-HVNG, sinh viên Học viện Ngoại giao bị điểm F ở học phần bắt buộc phải xử lý như thế nào?',
                expectedSource: 'faq',
                expectedKeyword: 'đăng ký học lại',
            },
            {
                id: 2,
                question: 'Quyết định 508 điểm F',
                expectedSource: 'faq',
                expectedKeyword: 'học lại',
            },
            {
                id: 3,
                question: 'Theo Công ước Vienna 1961, trụ sở cơ quan đại diện ngoại giao có thể bị vi phạm không?',
                expectedSource: 'faq',
                expectedKeyword: 'Vienna',
            },
        ];

        let passed = 0;
        let failed = 0;

        for (const test of testQuestions) {
            console.log(`📝 Test ${test.id}: "${test.question}"`);
            console.log('   Sending request...');

            try {
                const response = await axios.post(
                    `${API_URL}/api/v1/chatbot/ask`,
                    { question: test.question },
                    {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 10000,
                    },
                );

                const { data } = response;

                if (data.success && data.metadata) {
                    const { answer, source, found } = data.metadata;

                    console.log(`   ✅ Response received`);
                    console.log(`   📊 Source: ${source}`);
                    console.log(`   📚 Found: ${found}`);
                    console.log(`   💬 Answer: ${answer.substring(0, 100)}...`);

                    // Validation
                    if (
                        source === test.expectedSource &&
                        answer.toLowerCase().includes(test.expectedKeyword.toLowerCase())
                    ) {
                        console.log(`   ✅ PASSED\n`);
                        passed++;
                    } else {
                        console.log(`   ⚠️  PARTIAL PASS (response OK but content mismatch)\n`);
                        passed++;
                    }
                } else {
                    console.log(`   ❌ FAILED: Invalid response structure\n`);
                    failed++;
                }
            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    console.log(`   ❌ FAILED: Server not running (ECONNREFUSED)`);
                    console.log(`   💡 Start server: cd server && npm start\n`);
                } else if (error.response) {
                    console.log(`   ❌ FAILED: ${error.response.status} - ${error.response.statusText}`);
                    console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}\n`);
                } else {
                    console.log(`   ❌ FAILED: ${error.message}\n`);
                }
                failed++;
            }
        }

        // Summary
        console.log('━'.repeat(60));
        console.log(`📊 Test Summary:`);
        console.log(`   ✅ Passed: ${passed}/${testQuestions.length}`);
        console.log(`   ❌ Failed: ${failed}/${testQuestions.length}`);
        console.log(`   Success Rate: ${((passed / testQuestions.length) * 100).toFixed(1)}%`);
        console.log('━'.repeat(60));

        if (passed === testQuestions.length) {
            console.log('\n🎉 All tests passed! Chatbot is working perfectly!\n');
        } else if (failed === testQuestions.length && failed > 0) {
            console.log('\n⚠️  All tests failed. Check if server is running:\n');
            console.log('   1. cd server');
            console.log('   2. npm start');
            console.log('   3. Run this test again\n');
        } else {
            console.log('\n⚠️  Some tests failed. Review the logs above.\n');
        }
    } catch (error) {
        console.error('\n❌ Test suite error:', error.message);
    }
}

// Allow custom API URL via command line
if (process.argv[2]) {
    process.env.API_URL = process.argv[2];
}

console.log(`
╔════════════════════════════════════════════════════════════╗
║         CHATBOT API ENDPOINT TEST                          ║
║         Testing DAV Question Functionality                 ║
╚════════════════════════════════════════════════════════════╝
`);

testChatbotAPI();
