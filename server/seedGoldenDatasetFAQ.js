/**
 * Seed Script: Import Golden Dataset into FAQ Collection
 * ---------------------------------------------------------
 * Chức năng: Import 100 câu hỏi từ golden_dataset_enhanced.json vào FAQ collection
 * Mục đích: Cung cấp dữ liệu DAV (Học viện Ngoại giao) cho chatbot
 *
 * Cách chạy: node seedGoldenDatasetFAQ.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load models
const FAQ = require('./src/models/faq.model');

// Load Golden Dataset
const goldenDatasetPath = path.join(__dirname, 'scripts', 'golden_dataset_enhanced.json');

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

async function seedGoldenDatasetFAQ() {
    try {
        console.log('\n📦 Starting Golden Dataset FAQ Seeding...\n');

        // Read golden dataset
        const rawData = fs.readFileSync(goldenDatasetPath, 'utf8');
        const goldenDataset = JSON.parse(rawData);

        console.log(`📊 Loaded ${goldenDataset.length} items from golden_dataset_enhanced.json`);

        // Check existing FAQs to avoid duplicates
        const existingFAQs = await FAQ.find({}).select('question').lean();
        const existingQuestions = new Set(existingFAQs.map((faq) => faq.question.trim().toLowerCase()));

        console.log(`📚 Found ${existingFAQs.length} existing FAQs in database`);

        // Transform Golden Dataset to FAQ format
        const newFAQs = [];
        let skipped = 0;

        for (const item of goldenDataset) {
            // Skip if question already exists
            if (existingQuestions.has(item.question.trim().toLowerCase())) {
                skipped++;
                continue;
            }

            const faqData = {
                question: item.question,
                answer: item.golden_answer,
                keywords: item.keywords || [],
                category: item.category,
                topic: item.topic || '',
                complexity: (item.complexity || '').toLowerCase(), // 🔧 Convert to lowercase
                source_ref: item.source_ref || '',
                isActive: true,
                viewCount: 0,
            };

            newFAQs.push(faqData);
        }

        console.log(`\n📈 Import Summary:`);
        console.log(`   Total items: ${goldenDataset.length}`);
        console.log(`   Skipped (duplicates): ${skipped}`);
        console.log(`   To import: ${newFAQs.length}`);

        if (newFAQs.length === 0) {
            console.log('\n✅ No new FAQs to import. Database already up to date!');
            process.exit(0);
        }

        // Insert new FAQs
        console.log(`\n⚙️  Inserting ${newFAQs.length} new FAQs...`);
        const insertedFAQs = await FAQ.insertMany(newFAQs);

        console.log(`\n✅ Successfully imported ${insertedFAQs.length} FAQs!`);

        // Statistics by category
        const categoryStats = {};
        insertedFAQs.forEach((faq) => {
            categoryStats[faq.category] = (categoryStats[faq.category] || 0) + 1;
        });

        console.log(`\n📊 Category Distribution:`);
        Object.entries(categoryStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([category, count]) => {
                console.log(`   ${category}: ${count} FAQs`);
            });

        // Test a sample FAQ
        console.log(`\n🧪 Testing sample FAQ retrieval...`);
        const testQuestion = 'Theo Quyết định số 508/QĐ-HVNG';
        const testResult = await FAQ.findOne({
            question: { $regex: testQuestion, $options: 'i' },
        });

        if (testResult) {
            console.log(`✅ Test passed! Found FAQ:`);
            console.log(`   ID: ${testResult._id}`);
            console.log(`   Question: ${testResult.question}`);
            console.log(`   Category: ${testResult.category}`);
            console.log(`   Source: ${testResult.source_ref}`);
        } else {
            console.log(`⚠️  Test query didn't find expected FAQ. Check text index.`);
        }

        console.log(`\n✨ Golden Dataset FAQ seeding completed successfully!\n`);
    } catch (error) {
        console.error('\n❌ Error during seeding:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
    }
}

// Run the seed function
seedGoldenDatasetFAQ();
