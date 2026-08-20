/**
 * TEST SCRIPT FOR THESIS FIGURE 5.1 - RAG CITATION DEMO
 *
 * This script tests the RAG system's ability to:
 * 1. Retrieve the UNCLOS 1982 book
 * 2. Extract specific Article information (Điều 57, Điều 76)
 * 3. Generate accurate citations with location
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { askGeminiAI } = require('./src/utils/Chatbot/geminiAIWithRAG');

async function testThesisFigure5_1() {
    try {
        console.log('🎓 THESIS FIGURE 5.1 - RAG CITATION DEMO');
        console.log('='.repeat(80));
        console.log('Testing RAG system with UNCLOS 1982 query\n');

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Verify book exists
        const books = mongoose.connection.collection('books');
        const unclos = await books.findOne({ isbn: '978-604-2-30015-8' });

        if (!unclos) {
            console.error('❌ ERROR: UNCLOS book not found in database!');
            process.exit(1);
        }

        console.log('📚 UNCLOS Book Verification:');
        console.log(`   Title: ${unclos.title}`);
        console.log(`   ISBN: ${unclos.isbn}`);
        console.log(`   Location: ${unclos.location}`);
        console.log(`   Has embedding: ${unclos.embedding ? 'Yes (' + unclos.embedding.length + ' dims)' : 'No'}`);
        console.log();

        // Test Query for Thesis Demo
        const testQuery = 'Tìm tài liệu về Công ước Luật Biển 1982 và quy định về thềm lục địa.';

        console.log('📝 TEST QUERY FOR FIGURE 5.1:');
        console.log(`   "${testQuery}"`);
        console.log();

        console.log('⏳ Calling RAG system...\n');

        const startTime = Date.now();
        const result = await askGeminiAI(testQuery);
        const endTime = Date.now();

        console.log('✅ RAG RESPONSE:');
        console.log('─'.repeat(80));
        console.log(result.answer);
        console.log('─'.repeat(80));
        console.log();

        console.log(`⏱️  Response time: ${endTime - startTime}ms`);
        console.log(`📚 Source: ${result.source}`);
        console.log(`📖 Related books: ${result.relatedBooks?.length || 0}`);
        console.log();

        // Validation for Thesis Requirements
        console.log('🔍 VALIDATION CHECKS FOR THESIS:');
        const response = result.answer.toLowerCase();

        const checks = {
            'Contains "Công ước Liên Hợp Quốc về Luật Biển 1982" or "UNCLOS"':
                response.includes('công ước') && (response.includes('luật biển') || response.includes('unclos')),
            'Contains "thềm lục địa" (Continental Shelf)': response.includes('thềm lục địa'),
            'Contains citation "(Nguồn:"': result.answer.includes('(Nguồn:') || result.answer.includes('Nguồn:'),
            'Contains location "Kệ 341.45"': result.answer.includes('341.45') || result.answer.includes('Kệ 341'),
            'Contains "Điều 57" or "Điều 76"': result.answer.includes('Điều 57') || result.answer.includes('Điều 76'),
            'Contains "200 hải lý"': result.answer.includes('200 hải lý'),
        };

        let passedChecks = 0;
        for (const [check, passed] of Object.entries(checks)) {
            console.log(`   ${passed ? '✅' : '❌'} ${check}`);
            if (passed) passedChecks++;
        }

        console.log();
        console.log(`📊 VALIDATION SCORE: ${passedChecks}/${Object.keys(checks).length}`);

        if (passedChecks >= 4) {
            console.log('✅ PASSED - Response meets thesis requirements');
            console.log();
            console.log('📸 READY FOR SCREENSHOT:');
            console.log('   1. Start the server: npm start');
            console.log('   2. Navigate to chatbot interface');
            console.log('   3. Enter the test query');
            console.log('   4. Capture the response showing citations');
            console.log('   5. Use for Thesis Figure 5.1');
        } else {
            console.log('⚠️  WARNING - Response may need improvement');
            console.log();
            console.log('💡 SUGGESTIONS:');
            console.log('   - Book description should include Điều 57 and Điều 76');
            console.log('   - System prompt should enforce citation format');
            console.log('   - Check if embeddings are properly generated');
        }

        console.log();
        console.log('📋 RELATED BOOKS FOUND:');
        if (result.relatedBooks && result.relatedBooks.length > 0) {
            result.relatedBooks.slice(0, 5).forEach((book, i) => {
                console.log(`   ${i + 1}. ${book.title}`);
                if (book.location) console.log(`      📍 ${book.location}`);
            });
        } else {
            console.log('   (No related books in response)');
        }

        mongoose.connection.close();
        console.log();
        console.log('✅ Test completed successfully');
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.stack) {
            console.error('\n📋 Stack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run the test
testThesisFigure5_1();
