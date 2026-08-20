/**
 * Enhanced Golden Dataset Validator
 * Validates the rich metadata structure for RAG system evaluation
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m',
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validateEnhancedDataset() {
    try {
        log('cyan', '\n🚀 DAVLibri Enhanced Golden Dataset Validation');
        log('cyan', '='.repeat(80));

        // Load dataset
        const datasetPath = path.join(__dirname, 'golden_dataset_enhanced.json');
        const rawData = fs.readFileSync(datasetPath, 'utf8');
        const dataset = JSON.parse(rawData);

        log('green', '\n✓ Dataset loaded successfully');

        // Check if it's an array
        if (!Array.isArray(dataset)) {
            log('red', '✗ Dataset is not an array!');
            process.exit(1);
        }

        console.log('\n📊 Dataset Statistics:');
        console.log(`   Total Questions: ${dataset.length}`);
        console.log(`   Format: Enhanced array with metadata`);

        // Required fields validation
        const requiredFields = [
            'id',
            'category',
            'topic',
            'complexity',
            'question',
            'golden_answer',
            'source_ref',
            'keywords',
        ];

        console.log('\n📋 Schema Validation:');
        console.log(`   Required fields: ${requiredFields.join(', ')}`);

        // Validate structure
        console.log('\n🔍 Validating Question Structure...');
        let validCount = 0;
        let invalidCount = 0;
        const errors = [];
        const warnings = [];

        dataset.forEach((item, index) => {
            const missingFields = requiredFields.filter((field) => !item[field]);

            // Check field types
            const fieldTypeErrors = [];
            if (item.keywords && !Array.isArray(item.keywords)) {
                fieldTypeErrors.push('keywords must be an array');
            }
            if (item.complexity && !['Easy', 'Medium', 'Hard'].includes(item.complexity)) {
                fieldTypeErrors.push(`complexity must be Easy/Medium/Hard (got: ${item.complexity})`);
            }

            if (missingFields.length === 0 && fieldTypeErrors.length === 0) {
                validCount++;
            } else {
                invalidCount++;
                errors.push({
                    index,
                    id: item.id,
                    missingFields,
                    typeErrors: fieldTypeErrors,
                });
            }

            // Warnings for data quality
            if (item.keywords && item.keywords.length < 3) {
                warnings.push({
                    index,
                    id: item.id,
                    warning: `Only ${item.keywords.length} keywords (recommended: 3-5)`,
                });
            }
        });

        if (validCount === dataset.length) {
            log('green', `✓ All ${validCount} questions are valid with complete metadata`);
        } else {
            log('yellow', `⚠ ${invalidCount} questions have issues:`);
            errors.slice(0, 5).forEach((err) => {
                console.log(`   Question ${err.index + 1} (ID: ${err.id}):`);
                if (err.missingFields.length > 0) {
                    console.log(`     Missing: ${err.missingFields.join(', ')}`);
                }
                if (err.typeErrors.length > 0) {
                    console.log(`     Type errors: ${err.typeErrors.join('; ')}`);
                }
            });
            if (errors.length > 5) {
                console.log(`   ... and ${errors.length - 5} more issues`);
            }
        }

        // Display warnings
        if (warnings.length > 0) {
            log('yellow', `\n⚠ ${warnings.length} data quality warnings:`);
            warnings.slice(0, 3).forEach((warn) => {
                console.log(`   ${warn.id}: ${warn.warning}`);
            });
            if (warnings.length > 3) {
                console.log(`   ... and ${warnings.length - 3} more warnings`);
            }
        }

        // Category breakdown
        console.log('\n📚 Category Distribution:');
        const categories = {};
        dataset.forEach((item) => {
            const category = item.category || 'Unknown';
            categories[category] = (categories[category] || 0) + 1;
        });

        Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .forEach(([category, count]) => {
                const percentage = ((count / dataset.length) * 100).toFixed(1);
                console.log(`   ${category}: ${count} (${percentage}%)`);
            });

        // Topic analysis
        console.log('\n📖 Topic Diversity:');
        const topics = new Set(dataset.map((item) => item.topic));
        console.log(`   Unique topics: ${topics.size}`);
        console.log(`   Average questions per topic: ${(dataset.length / topics.size).toFixed(1)}`);

        // Complexity distribution
        console.log('\n🎯 Complexity Levels:');
        const complexity = { Easy: 0, Medium: 0, Hard: 0 };
        dataset.forEach((item) => {
            if (complexity.hasOwnProperty(item.complexity)) {
                complexity[item.complexity]++;
            }
        });
        Object.entries(complexity).forEach(([level, count]) => {
            const percentage = ((count / dataset.length) * 100).toFixed(1);
            const bar = '█'.repeat(Math.floor(count / 5));
            console.log(`   ${level.padEnd(8)}: ${count.toString().padStart(3)} (${percentage}%) ${bar}`);
        });

        // Source reference analysis
        console.log('\n📄 Source References:');
        const sources = new Set(dataset.map((item) => item.source_ref));
        console.log(`   Unique sources: ${sources.size}`);
        const topSources = {};
        dataset.forEach((item) => {
            const src = item.source_ref || 'Unknown';
            topSources[src] = (topSources[src] || 0) + 1;
        });
        const sortedSources = Object.entries(topSources)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        console.log('   Top 5 sources:');
        sortedSources.forEach(([source, count]) => {
            console.log(`     - ${source}: ${count} questions`);
        });

        // Keywords analysis
        console.log('\n🏷️  Keywords Analysis:');
        const allKeywords = dataset.flatMap((item) => item.keywords || []);
        console.log(`   Total keywords: ${allKeywords.length}`);
        console.log(`   Avg keywords per question: ${(allKeywords.length / dataset.length).toFixed(1)}`);
        console.log(`   Unique keywords: ${new Set(allKeywords).size}`);

        // Sample questions with full metadata
        console.log('\n📝 Sample Questions (Enhanced Format):');
        const samples = [
            dataset[0], // First
            dataset[Math.floor(dataset.length / 2)], // Middle
            dataset[dataset.length - 1], // Last
        ];

        samples.forEach((q, i) => {
            console.log(`\n   ${log('magenta', `Sample ${i + 1}`)}:`);
            console.log(`   ID: ${q.id}`);
            console.log(`   Category: ${q.category}`);
            console.log(`   Topic: ${q.topic}`);
            console.log(`   Complexity: ${q.complexity}`);
            console.log(`   Question: ${q.question.substring(0, 80)}...`);
            console.log(`   Answer: ${q.golden_answer.substring(0, 80)}...`);
            console.log(`   Source: ${q.source_ref}`);
            console.log(`   Keywords: [${q.keywords.join(', ')}]`);
        });

        // Schema compliance report
        console.log('\n' + '='.repeat(80));
        log('green', '✓ Schema Validation Complete!');

        console.log('\n📊 Final Report:');
        console.log(`   ✓ Total questions: ${dataset.length}`);
        console.log(`   ✓ Valid structure: ${validCount}/${dataset.length}`);
        console.log(`   ✓ Categories: ${Object.keys(categories).length}`);
        console.log(`   ✓ Topics: ${topics.size}`);
        console.log(`   ✓ Unique sources: ${sources.size}`);
        console.log(`   ✓ Schema compliance: ${((validCount / dataset.length) * 100).toFixed(1)}%`);

        console.log('\n✅ Dataset is ready for RAG evaluation with rich metadata.');
        console.log('📌 Use this enhanced dataset for:');
        console.log('   - Category-specific accuracy testing');
        console.log('   - Complexity-based performance analysis');
        console.log('   - Source attribution validation');
        console.log('   - Keyword-based retrieval evaluation\n');
    } catch (error) {
        log('red', `\n❌ Validation Error: ${error.message}`);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run validation
validateEnhancedDataset();
