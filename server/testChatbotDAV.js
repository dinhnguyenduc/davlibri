/**
 * Script: Test Chatbot with DAV Question
 * ----------------------------------------
 * Mục đích: Kiểm tra xem chatbot có trả lời được câu hỏi DAV không
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

async function testChatbotFAQ() {
    try {
        console.log('\n🧪 Testing Chatbot FAQ Retrieval\n');

        const question =
            'Theo Quyết định số 508/QĐ-HVNG, sinh viên Học viện Ngoại giao bị điểm F ở học phần bắt buộc phải xử lý như thế nào?';

        console.log(`📝 User Question:\n   "${question}"\n`);

        // Test 1: Text Search (như chatbot controller sử dụng)
        console.log('🔍 Test 1: Text Search (MongoDB $text)');
        const textResults = await FAQ.find({
            isActive: true,
            $text: { $search: question },
        })
            .select('question answer category source_ref')
            .limit(5);

        console.log(`   Found: ${textResults.length} results`);

        if (textResults.length > 0) {
            console.log(`\n✅ Top Result:`);
            console.log(`   Category: ${textResults[0].category}`);
            console.log(`   Source: ${textResults[0].source_ref}`);
            console.log(`   Question: ${textResults[0].question}`);
            console.log(`   Answer: ${textResults[0].answer.substring(0, 150)}...`);
        }

        // Test 2: Keyword Search
        console.log('\n🔍 Test 2: Keyword Search');
        const keywords = ['Quyết định 508', 'điểm F', 'học phần bắt buộc'];

        for (const keyword of keywords) {
            const keywordResults = await FAQ.find({
                isActive: true,
                $or: [
                    { question: { $regex: keyword, $options: 'i' } },
                    { keywords: { $in: [new RegExp(keyword, 'i')] } },
                    { source_ref: { $regex: keyword, $options: 'i' } },
                ],
            }).limit(3);

            console.log(`   "${keyword}": ${keywordResults.length} results`);
        }

        // Test 3: Check specific FAQ
        console.log('\n🔍 Test 3: Direct FAQ Lookup by ID DAV_REG_001');
        const directLookup = await FAQ.findOne({
            question: { $regex: '508/QĐ-HVNG.*điểm F', $options: 'i' },
        });

        if (directLookup) {
            console.log(`   ✅ Found FAQ directly`);
            console.log(`   MongoDB _id: ${directLookup._id}`);
            console.log(`   View Count: ${directLookup.viewCount}`);
        }

        // Test 4: Database Stats
        console.log('\n📊 Database Statistics:');
        const totalFAQs = await FAQ.countDocuments();
        const activeFAQs = await FAQ.countDocuments({ isActive: true });
        const davFAQs = await FAQ.countDocuments({
            category: { $in: ['Quy chế Học viện', 'Chính trị - Đối ngoại', 'Luật pháp Quốc tế'] },
        });

        console.log(`   Total FAQs: ${totalFAQs}`);
        console.log(`   Active FAQs: ${activeFAQs}`);
        console.log(`   DAV-related FAQs: ${davFAQs}`);

        // Summary
        console.log('\n📈 Test Summary:');
        if (textResults.length > 0) {
            console.log('   ✅ Text search: WORKING');
            console.log('   ✅ Chatbot should be able to answer DAV questions');
            console.log('\n💡 Next Step: Test on the actual website chatbot interface');
            console.log('   URL: http://localhost:5173 (or your client URL)');
            console.log('   Ask: "Theo Quyết định số 508/QĐ-HVNG, sinh viên bị điểm F phải xử lý thế nào?"');
        } else {
            console.log('   ❌ Text search: NOT WORKING');
            console.log('   ⚠️  Need to investigate further');
        }

        console.log('\n✨ Test completed!\n');
    } catch (error) {
        console.error('\n❌ Error during test:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

testChatbotFAQ();
