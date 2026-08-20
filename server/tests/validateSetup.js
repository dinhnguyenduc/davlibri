/**
 * Validation script: Kiểm tra xem tất cả optimization đã được setup chưa
 * Usage: node validateSetup.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

const checks = [];

function logCheck(name, passed, message = '') {
    checks.push({ name, passed, message });
    const icon = passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    const msg = message ? ` - ${message}` : '';
    console.log(`  ${icon} ${name}${msg}`);
}

async function validateSetup() {
    console.log(`\n${colors.cyan}╔════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║     CHATBOT OPTIMIZATION VALIDATION           ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════════════╝${colors.reset}\n`);

    // ========================================
    // 1. Environment Variables
    // ========================================
    console.log(`${colors.blue}📋 Checking Environment Variables...${colors.reset}`);

    logCheck('MONGO_URI', !!process.env.MONGO_URI, process.env.MONGO_URI ? 'Set' : 'Missing');

    logCheck(
        'GEMINI_API_KEY',
        !!process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 8)}...` : 'Missing',
    );

    logCheck(
        'USE_RAG_MODE',
        process.env.USE_RAG_MODE === 'true',
        process.env.USE_RAG_MODE === 'true' ? 'Enabled' : 'Disabled',
    );

    // ========================================
    // 2. File Structure
    // ========================================
    console.log(`\n${colors.blue}📁 Checking File Structure...${colors.reset}`);

    const requiredFiles = [
        'src/models/books.model.js',
        'src/utils/Chatbot/geminiAIWithRAG.js',
        'src/utils/Chatbot/cacheManager.js',
        'src/controllers/chatbot.controller.js',
        'createTextIndexes.js',
        'benchmarkChatbot.js',
    ];

    for (const file of requiredFiles) {
        const fullPath = path.join(__dirname, file);
        const exists = fs.existsSync(fullPath);
        logCheck(file, exists);
    }

    // ========================================
    // 3. Database Connection & Indexes
    // ========================================
    if (process.env.MONGO_URI) {
        console.log(`\n${colors.blue}🔌 Checking Database Connection...${colors.reset}`);

        try {
            await mongoose.connect(process.env.MONGO_URI);
            logCheck('MongoDB Connection', true, 'Connected');

            const db = mongoose.connection.db;

            // Check Products indexes
            console.log(`\n${colors.blue}📚 Checking Products Indexes...${colors.reset}`);
            const productIndexes = await db.collection('products').indexes();

            const hasTextIndex = productIndexes.some((idx) => idx.name === 'ProductSearchIndex');
            logCheck(
                'Products Text Index',
                hasTextIndex,
                hasTextIndex ? 'Found' : 'Missing - Run createTextIndexes.js',
            );

            const hasStockIndex = productIndexes.some((idx) => idx.name === 'stock_viewCount');
            logCheck('Products Stock Index', hasStockIndex);

            const hasAuthorIndex = productIndexes.some((idx) => idx.name === 'author_index');
            logCheck('Products Author Index', hasAuthorIndex);

            // Check FAQs indexes
            console.log(`\n${colors.blue}❓ Checking FAQs Indexes...${colors.reset}`);
            const faqIndexes = await db.collection('faqs').indexes();

            const hasFAQTextIndex = faqIndexes.some((idx) => idx.name === 'FAQSearchIndex');
            logCheck(
                'FAQs Text Index',
                hasFAQTextIndex,
                hasFAQTextIndex ? 'Found' : 'Missing - Run createTextIndexes.js',
            );

            // Check sample data
            console.log(`\n${colors.blue}📊 Checking Sample Data...${colors.reset}`);

            const productCount = await db.collection('products').countDocuments();
            logCheck('Products Collection', productCount > 0, `${productCount} documents`);

            const faqCount = await db.collection('faqs').countDocuments();
            logCheck('FAQs Collection', faqCount > 0, `${faqCount} documents`);

            // Check schema fields
            console.log(`\n${colors.blue}🔍 Checking Schema Fields...${colors.reset}`);

            const sampleProduct = await db.collection('products').findOne({});
            if (sampleProduct) {
                logCheck('Field: nameProduct', !!sampleProduct.nameProduct);
                logCheck(
                    'Field: author',
                    !!sampleProduct.author,
                    sampleProduct.author ? 'Present' : 'Missing (optional)',
                );
                logCheck(
                    'Field: keywords',
                    Array.isArray(sampleProduct.keywords),
                    Array.isArray(sampleProduct.keywords) ? 'Present' : 'Missing (optional)',
                );
            }

            await mongoose.connection.close();
        } catch (error) {
            logCheck('MongoDB Connection', false, error.message);
        }
    }

    // ========================================
    // 4. Code Validation
    // ========================================
    console.log(`\n${colors.blue}🔧 Checking Code Implementation...${colors.reset}`);

    // Check if cacheManager is imported
    const controllerPath = path.join(__dirname, 'src/controllers/chatbot.controller.js');
    if (fs.existsSync(controllerPath)) {
        const controllerCode = fs.readFileSync(controllerPath, 'utf-8');
        logCheck('Cache Import', controllerCode.includes('cacheManager'));
        logCheck('Cache Usage', controllerCode.includes('cacheManager.getFAQ'));
        logCheck('Cache Clear', controllerCode.includes('clearFAQCache'));
    }

    // Check geminiAIWithRAG optimization
    const ragPath = path.join(__dirname, 'src/utils/Chatbot/geminiAIWithRAG.js');
    if (fs.existsSync(ragPath)) {
        const ragCode = fs.readFileSync(ragPath, 'utf-8');
        logCheck('Text Search Implementation', ragCode.includes('$text: { $search:'));
        logCheck('Temperature Optimization', ragCode.includes('temperature: 0.4'));
        logCheck('Token Limit Reduction', ragCode.includes('maxOutputTokens: 600'));
    }

    // ========================================
    // Summary
    // ========================================
    console.log(`\n${colors.cyan}╔════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║              VALIDATION SUMMARY                ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════════════╝${colors.reset}\n`);

    const totalChecks = checks.length;
    const passedChecks = checks.filter((c) => c.passed).length;
    const failedChecks = totalChecks - passedChecks;

    console.log(`  Total Checks:    ${totalChecks}`);
    console.log(`  Passed:          ${colors.green}${passedChecks}${colors.reset}`);
    console.log(`  Failed:          ${failedChecks > 0 ? colors.red : colors.green}${failedChecks}${colors.reset}`);
    console.log(`  Success Rate:    ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);

    if (failedChecks > 0) {
        console.log(`\n${colors.yellow}⚠️  ISSUES FOUND${colors.reset}`);
        console.log(`\nFailed checks:`);
        checks
            .filter((c) => !c.passed)
            .forEach((c) => {
                console.log(`  ${colors.red}✗${colors.reset} ${c.name} ${c.message ? `- ${c.message}` : ''}`);
            });

        console.log(`\n${colors.yellow}💡 RECOMMENDATIONS:${colors.reset}`);

        if (checks.some((c) => c.name.includes('Text Index') && !c.passed)) {
            console.log(`  1. Run: ${colors.cyan}node createTextIndexes.js${colors.reset}`);
        }

        if (!process.env.GEMINI_API_KEY) {
            console.log(`  2. Set GEMINI_API_KEY in .env file`);
        }

        if (process.env.USE_RAG_MODE !== 'true') {
            console.log(`  3. Set USE_RAG_MODE=true in .env file`);
        }

        console.log(`\n${colors.yellow}📖 See OPTIMIZATION_GUIDE.md for detailed instructions${colors.reset}`);
    } else {
        console.log(`\n${colors.green}✅ ALL CHECKS PASSED!${colors.reset}`);
        console.log(`\n${colors.green}🎉 Your chatbot is fully optimized and ready to use!${colors.reset}`);
        console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
        console.log(`  1. Start server: npm start`);
        console.log(`  2. Run benchmark: node benchmarkChatbot.js`);
        console.log(`  3. Test manually: POST /api/chatbot/ask`);
    }

    console.log(`\n${colors.cyan}════════════════════════════════════════════════${colors.reset}\n`);
}

// Run validation
validateSetup()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(`\n${colors.red}❌ Validation failed:${colors.reset}`, error);
        process.exit(1);
    });
