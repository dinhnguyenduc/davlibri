#!/usr/bin/env node

/**
 * Monitor Latency Benchmark Progress
 * Auto-checks every 30 seconds and notifies when complete
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../benchmark-results/latency-results.csv');
const CHECK_INTERVAL = 30000; // 30 seconds

console.log('\n📊 MONITORING LATENCY BENCHMARK');
console.log('━'.repeat(60));
console.log(`🔍 Watching: ${CSV_PATH}`);
console.log(`⏱️  Check interval: ${CHECK_INTERVAL / 1000}s`);
console.log('━'.repeat(60));

let checkCount = 0;
const startTime = Date.now();

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
}

function checkBenchmark() {
    checkCount++;
    const elapsed = Date.now() - startTime;

    console.log(`\n[${new Date().toLocaleTimeString()}] Check #${checkCount} (Elapsed: ${formatTime(elapsed)})`);

    if (fs.existsSync(CSV_PATH)) {
        console.log('\n🎉 ✅ BENCHMARK COMPLETED!');
        console.log('━'.repeat(60));

        // Read and display results
        const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
        console.log('\n📄 Results:');
        console.log(csvContent);

        // Parse and analyze
        const lines = csvContent.trim().split('\n');
        if (lines.length >= 3) {
            const [header, missLine, hitLine] = lines;
            const missData = missLine.split(',');
            const hitData = hitLine.split(',');

            const missLatency = parseFloat(missData[1]);
            const hitLatency = parseFloat(hitData[1]);
            const improvement = (((missLatency - hitLatency) / missLatency) * 100).toFixed(1);

            console.log('\n📊 Analysis:');
            console.log(`   Cache Miss:   ${missLatency.toFixed(0)}ms (${missData[2]} samples)`);
            console.log(`   Cache Hit:    ${hitLatency.toFixed(0)}ms (${hitData[2]} samples)`);
            console.log(`   Improvement:  ${improvement}% faster with cache ✅`);

            if (parseFloat(improvement) >= 60) {
                console.log('\n✅ TARGET MET: Cache improvement ≥60%');
            } else {
                console.log('\n⚠️  Warning: Cache improvement below 60% target');
            }
        }

        console.log('\n━'.repeat(60));
        console.log('🎯 NEXT STEPS:');
        console.log('   1. Refresh browser: latency-chart.html');
        console.log('   2. Take screenshot for Biểu đồ 5.1');
        console.log('   3. Check: SCREENSHOT_CHECKLIST.md');
        console.log('━'.repeat(60));

        process.exit(0);
    } else {
        console.log('   ⏳ Still running... CSV not found yet');
        console.log(`   💡 Estimated completion: ${formatTime(900000 - elapsed)} remaining`);
    }
}

// Initial check
checkBenchmark();

// Set up periodic checks
const intervalId = setInterval(checkBenchmark, CHECK_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Monitoring stopped by user');
    clearInterval(intervalId);
    process.exit(0);
});

console.log('\n💡 Press Ctrl+C to stop monitoring');
