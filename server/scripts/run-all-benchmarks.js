/**
 * RUN ALL BENCHMARKS - CHƯƠNG 5
 * ==============================
 * Chạy tất cả các benchmark scripts theo thứ tự:
 * 1. Token Counter (fastest, ~10s)
 * 2. Evaluate Accuracy (~2-3 minutes)
 * 3. Error Analysis (~2-3 minutes)
 * 4. Benchmark Latency (longest, ~10-15 minutes with API calls)
 *
 * Output: Tất cả CSV và JSON files trong /benchmark-results/
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const colors = require('colors');

const SCRIPTS = [
    {
        name: 'Token Counter',
        file: 'token-counter.js',
        description: 'Đếm tokens và tính chi phí API',
        estimatedTime: '10 seconds',
        chapter: '5.2.2',
    },
    {
        name: 'Evaluate Accuracy',
        file: 'evaluate-accuracy-fixed.js',
        description: 'Đánh giá Precision@5 và Faithfulness',
        estimatedTime: '2-3 minutes',
        chapter: '5.2.3',
    },
    {
        name: 'Error Analysis',
        file: 'error-analysis.js',
        description: 'Phân tích các trường hợp sai',
        estimatedTime: '2-3 minutes',
        chapter: '5.2.3',
    },
    {
        name: 'Benchmark Latency',
        file: 'benchmark-latency.js',
        description: 'Đo độ trễ Cache Hit vs Cache Miss',
        estimatedTime: '10-15 minutes (WARNING: Makes real API calls)',
        chapter: '5.2.1',
    },
];

// Results summary
const summary = {
    startTime: new Date(),
    endTime: null,
    totalDuration: 0,
    results: [],
    outputFiles: [],
};

/**
 * Run a single script
 */
function runScript(script) {
    console.log('\n' + '═'.repeat(70));
    console.log(`🚀 Running: ${script.name}`.cyan.bold);
    console.log(`   Chapter: ${script.chapter}`.gray);
    console.log(`   Description: ${script.description}`.gray);
    console.log(`   Estimated time: ${script.estimatedTime}`.yellow);
    console.log('═'.repeat(70));

    const scriptPath = path.join(__dirname, script.file);
    const startTime = Date.now();

    try {
        // Run script and capture output
        const output = execSync(`node "${scriptPath}"`, {
            cwd: __dirname,
            encoding: 'utf8',
            stdio: 'inherit', // Show output in real-time
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(`\n✅ ${script.name} completed in ${duration}s`.green.bold);

        summary.results.push({
            script: script.name,
            status: 'SUCCESS',
            duration: parseFloat(duration),
            chapter: script.chapter,
        });

        return { success: true, duration };
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        console.error(`\n❌ ${script.name} failed after ${duration}s`.red.bold);
        console.error(error.message);

        summary.results.push({
            script: script.name,
            status: 'FAILED',
            duration: parseFloat(duration),
            error: error.message,
            chapter: script.chapter,
        });

        return { success: false, duration, error };
    }
}

/**
 * Check output files
 */
function checkOutputFiles() {
    const outputDir = path.join(__dirname, '../benchmark-results');

    if (!fs.existsSync(outputDir)) {
        console.log('\n⚠️  Warning: Output directory not found'.yellow);
        return;
    }

    const files = fs.readdirSync(outputDir);

    console.log('\n📁 Output Files Generated:');
    files.forEach((file) => {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024).toFixed(2);

        console.log(`   ✅ ${file} (${size} KB)`.green);
        summary.outputFiles.push({
            filename: file,
            size: `${size} KB`,
            path: filePath,
        });
    });
}

/**
 * Generate final report
 */
function generateReport() {
    summary.endTime = new Date();
    summary.totalDuration = ((summary.endTime - summary.startTime) / 1000 / 60).toFixed(1);

    console.log('\n' + '═'.repeat(70));
    console.log('📊 BENCHMARK SUMMARY'.cyan.bold);
    console.log('═'.repeat(70));

    console.log(`\n⏱️  Total Duration: ${summary.totalDuration} minutes`);

    console.log('\n📈 Script Results:');
    summary.results.forEach((result, i) => {
        const status = result.status === 'SUCCESS' ? '✅'.green : '❌'.red;
        console.log(`   ${i + 1}. ${status} ${result.script} (${result.duration}s) - Chapter ${result.chapter}`);
        if (result.error) {
            console.log(`      Error: ${result.error}`.red);
        }
    });

    const successCount = summary.results.filter((r) => r.status === 'SUCCESS').length;
    const failCount = summary.results.filter((r) => r.status === 'FAILED').length;

    console.log(`\n✅ Passed: ${successCount}/${summary.results.length}`);
    if (failCount > 0) {
        console.log(`❌ Failed: ${failCount}/${summary.results.length}`.red);
    }

    // Export summary
    const summaryPath = path.join(__dirname, '../benchmark-results/benchmark-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`\n📄 Summary exported: ${summaryPath}`.gray);

    console.log('\n═'.repeat(70));
}

/**
 * Display instructions
 */
function displayInstructions() {
    console.log('\n📚 NEXT STEPS:'.yellow.bold);
    console.log('\n1. Check results in: server/benchmark-results/');
    console.log('   - latency-results.csv → Import to Excel for Biểu đồ 5.1');
    console.log('   - accuracy-summary.csv → Metrics for Table 5.2');
    console.log('   - token-cost-summary.csv → Cost analysis for Section 5.2.2');
    console.log('   - error-analysis.json → Error breakdown for Section 5.2.3');

    console.log('\n2. Create Excel Charts:');
    console.log('   - Open latency-results.csv in Excel');
    console.log('   - Select data → Insert → Column Chart');
    console.log('   - Label: "Biểu đồ 5.1: So sánh thời gian phản hồi"');

    console.log('\n3. Update Thesis Chapter 5:');
    console.log('   - Section 5.2.1: Use latency metrics');
    console.log('   - Section 5.2.2: Use token cost data');
    console.log('   - Section 5.2.3: Use accuracy + error analysis');

    console.log('\n4. Take Screenshots:');
    console.log('   - Hình 5.1: Chatbot answering DAV question');
    console.log('   - Hình 5.2: Search comparison (semantic vs keyword)');

    console.log('\n✨ All benchmarks completed!\n');
}

/**
 * Main function
 */
async function main() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║         🚀 RUN ALL BENCHMARKS - CHƯƠNG 5                      ║'.cyan.bold);
    console.log('║         Comprehensive Performance Evaluation                   ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('📋 Scripts to run:');
    SCRIPTS.forEach((script, i) => {
        console.log(`   ${i + 1}. ${script.name} (${script.estimatedTime})`);
    });

    const totalEstimate = 'Estimated total: 15-20 minutes';
    console.log(`\n⏱️  ${totalEstimate}`.yellow);

    console.log('\n⚠️  WARNING:'.red.bold);
    console.log('   - benchmark-latency.js will make REAL API calls to Google Gemini');
    console.log('   - This will consume API quota and may incur costs');
    console.log('   - Consider skipping it if you just need accuracy metrics');

    console.log('\n💡 TIP: You can also run scripts individually:'.cyan);
    console.log('   node scripts/token-counter.js');
    console.log('   node scripts/evaluate-accuracy-fixed.js');
    console.log('   node scripts/error-analysis.js');

    // Prompt to continue (optional - remove if running in CI/CD)
    console.log('\n▶️  Starting benchmarks in 3 seconds... (Ctrl+C to cancel)'.yellow);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Run all scripts
    for (let i = 0; i < SCRIPTS.length; i++) {
        const script = SCRIPTS[i];

        // Skip latency benchmark if flag is set
        if (process.env.SKIP_LATENCY === 'true' && script.file === 'benchmark-latency.js') {
            console.log(`\n⏭️  Skipping ${script.name} (SKIP_LATENCY=true)`.yellow);
            summary.results.push({
                script: script.name,
                status: 'SKIPPED',
                duration: 0,
                chapter: script.chapter,
            });
            continue;
        }

        const result = runScript(script);

        // Small delay between scripts
        if (i < SCRIPTS.length - 1) {
            console.log('\n⏸️  Waiting 2 seconds before next script...'.gray);
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }

    // Check output files
    checkOutputFiles();

    // Generate final report
    generateReport();

    // Display next steps
    displayInstructions();
}

// Run main function
main().catch((error) => {
    console.error('\n❌ Benchmark suite failed:'.red.bold, error);
    process.exit(1);
});
