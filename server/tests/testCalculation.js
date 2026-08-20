/**
 * Test script: Kiểm tra calculation logic
 * Usage: node testCalculation.js
 */

const { parseQuery, calculateRentalCost } = require('./src/utils/Chatbot/queryParser');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

console.log(`\n${colors.cyan}╔════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║     CALCULATION LOGIC TEST                    ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════╝${colors.reset}\n`);

// Test cases
const testCases = [
    {
        question: 'sách chính trị quốc tế hiện đại thuê hết bao nhiêu tiền 5 ngày',
        expectedIntent: 'CALCULATE',
        expectedDuration: 5,
    },
    {
        question: 'thuê sách kinh tế 2 tuần tốn bao nhiêu',
        expectedIntent: 'CALCULATE',
        expectedDuration: 14,
    },
    {
        question: 'chi phí thuê sách ASEAN 1 tháng',
        expectedIntent: 'CALCULATE',
        expectedDuration: 30,
    },
    {
        question: 'tìm sách về ngoại giao',
        expectedIntent: 'SEARCH',
        expectedDuration: null,
    },
    {
        question: 'làm thế nào để thuê sách',
        expectedIntent: 'INFO',
        expectedDuration: null,
    },
];

console.log(`${colors.blue}📋 Running ${testCases.length} test cases...${colors.reset}\n`);

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    console.log(`${colors.yellow}Test ${index + 1}:${colors.reset} "${testCase.question}"`);

    const result = parseQuery(testCase.question);

    console.log('  📊 Result:');
    console.log(`     Intent: ${result.intent.type} (confidence: ${result.intent.confidence})`);
    console.log(`     Duration: ${result.duration ? result.duration.days + ' ngày' : 'None'}`);
    console.log(`     Book Name: "${result.bookName}"`);
    console.log(`     Needs Calculation: ${result.needsCalculation}`);

    // Validate
    const intentMatch = result.intent.type === testCase.expectedIntent;
    const durationMatch =
        testCase.expectedDuration === null
            ? result.duration === null
            : result.duration?.days === testCase.expectedDuration;

    if (intentMatch && durationMatch) {
        console.log(`  ${colors.green}✓ PASS${colors.reset}\n`);
        passed++;
    } else {
        console.log(`  ${colors.red}✗ FAIL${colors.reset}`);
        console.log(`     Expected: Intent=${testCase.expectedIntent}, Duration=${testCase.expectedDuration}`);
        console.log(`     Got: Intent=${result.intent.type}, Duration=${result.duration?.days}\n`);
        failed++;
    }
});

// Test calculation
console.log(`${colors.blue}🧮 Testing Calculation Function...${colors.reset}\n`);

const calcTestCases = [
    { pricePerDay: 5000, days: 5, expected: 25000 },
    { pricePerDay: 10000, days: 14, expected: 140000 },
    { pricePerDay: 8000, days: 30, expected: 240000 },
];

calcTestCases.forEach((test, index) => {
    const duration = { value: test.days, unit: 'ngày', days: test.days };
    const result = calculateRentalCost(test.pricePerDay, duration);

    const match = result.total === test.expected;

    if (match) {
        console.log(`${colors.green}✓${colors.reset} ${test.pricePerDay}đ × ${test.days} ngày = ${result.total}đ`);
        passed++;
    } else {
        console.log(`${colors.red}✗${colors.reset} Expected ${test.expected}đ, got ${result.total}đ`);
        failed++;
    }
});

// Summary
console.log(`\n${colors.cyan}╔════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║              TEST SUMMARY                      ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════╝${colors.reset}\n`);

const total = passed + failed;
console.log(`  Total Tests:    ${total}`);
console.log(`  Passed:         ${colors.green}${passed}${colors.reset}`);
console.log(`  Failed:         ${failed > 0 ? colors.red : colors.green}${failed}${colors.reset}`);
console.log(`  Success Rate:   ${((passed / total) * 100).toFixed(1)}%`);

if (failed === 0) {
    console.log(`\n${colors.green}✅ ALL TESTS PASSED!${colors.reset}`);
    console.log(`\n${colors.cyan}🎉 Calculation logic is working correctly!${colors.reset}`);
} else {
    console.log(`\n${colors.red}❌ SOME TESTS FAILED${colors.reset}`);
    console.log(`\n${colors.yellow}Please check the logic and try again.${colors.reset}`);
}

console.log(`\n${colors.cyan}════════════════════════════════════════════════${colors.reset}\n`);

process.exit(failed > 0 ? 1 : 0);
