/**
 * Simple Evaluation Script - Tests golden_dataset.json structure
 * No need for complex dependencies, just validates dataset
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validateGoldenDataset() {
    try {
        log('cyan', '\n🚀 DAVLibri Dataset Validation');
        log('cyan', '='.repeat(70));

        // Load dataset
        const datasetPath = path.join(__dirname, 'golden_dataset.json');
        const rawData = fs.readFileSync(datasetPath, 'utf8');
        const dataset = JSON.parse(rawData);

        log('green', '\n✓ Dataset loaded successfully');

        // Check if it's an array
        if (!Array.isArray(dataset)) {
            log('red', '✗ Dataset is not an array!');
            process.exit(1);
        }

        // Basic statistics
        console.log('\n📊 Dataset Statistics:');
        console.log(`   Total Questions: ${dataset.length}`);
        console.log(`   Format: Simple array (id, domain, question, answer)`);

        // Domain breakdown
        console.log('\n📚 Domain Breakdown:');
        const domains = {};
        dataset.forEach((item) => {
            const domain = item.domain || 'Unknown';
            domains[domain] = (domains[domain] || 0) + 1;
        });

        Object.entries(domains).forEach(([domain, count]) => {
            console.log(`   ${domain}: ${count} questions`);
        });

        // Validate structure
        console.log('\n🔍 Validating Question Structure...');
        let validCount = 0;
        let invalidCount = 0;
        const errors = [];

        dataset.forEach((item, index) => {
            const requiredFields = ['id', 'domain', 'question', 'answer'];
            const missingFields = requiredFields.filter((field) => !item[field]);

            if (missingFields.length === 0) {
                validCount++;
            } else {
                invalidCount++;
                errors.push({
                    index,
                    id: item.id,
                    missingFields,
                });
            }
        });

        if (validCount === dataset.length) {
            log('green', `✓ All ${validCount} questions are valid`);
        } else {
            log('yellow', `⚠ ${invalidCount} questions have issues:`);
            errors.slice(0, 5).forEach((err) => {
                console.log(`   Question ${err.index + 1} (ID: ${err.id}): Missing ${err.missingFields.join(', ')}`);
            });
        }

        // Sample questions
        console.log('\n📝 Sample Questions:');
        const samples = [
            dataset[0], // First question
            dataset[Math.floor(dataset.length / 2)], // Middle question
            dataset[dataset.length - 1], // Last question
        ].filter(Boolean);

        samples.forEach((q, i) => {
            console.log(`\n   Sample ${i + 1}:`);
            console.log(`   ID: ${q.id}`);
            console.log(`   Domain: ${q.domain}`);
            console.log(`   Question: ${q.question.substring(0, 80)}...`);
        });

        // Final report
        console.log('\n' + '='.repeat(70));
        log('green', '✓ Validation Complete!');
        console.log(`\nDataset is ready for evaluation with ${dataset.length} questions.`);
        console.log('To run full evaluation (requires server running):');
        console.log('  npm run benchmark   - Performance tests');
        console.log('  npm run evaluate    - Accuracy tests (requires fixing HybridSearchService)\n');
    } catch (error) {
        log('red', `\n❌ Validation Error: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run validation
validateGoldenDataset();
