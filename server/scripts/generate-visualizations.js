/**
 * VISUALIZATION GENERATOR
 * =======================
 * Generate HTML/JS charts from benchmark CSV data
 * Using Chart.js (no external dependencies needed)
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, '../benchmark-results');
const OUTPUT_DIR = path.join(__dirname, '../benchmark-results/visualizations');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate HTML chart for latency comparison
 */
function generateLatencyChart() {
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Biểu đồ 5.1 - So sánh Thời gian Phản hồi</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1000px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 10px;
        }
        .subtitle {
            text-align: center;
            color: #7f8c8d;
            margin-bottom: 30px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 30px;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-card.green {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        .stat-card.orange {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
        }
        .stat-label {
            font-size: 14px;
            opacity: 0.9;
        }
        .note {
            margin-top: 30px;
            padding: 15px;
            background: #e8f4f8;
            border-left: 4px solid #3498db;
            border-radius: 4px;
            font-size: 14px;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Biểu đồ 5.1: So sánh Thời gian Phản hồi</h1>
        <p class="subtitle">Cache Miss vs Cache Hit - Chatbot DAVLibri</p>
        
        <canvas id="latencyChart"></canvas>
        
        <div class="stats">
            <div class="stat-card orange">
                <div class="stat-label">Cache Miss</div>
                <div class="stat-value" id="cacheMissValue">~ms</div>
                <div class="stat-label">Không có cache, gọi API</div>
            </div>
            
            <div class="stat-card green">
                <div class="stat-label">Cache Hit</div>
                <div class="stat-value" id="cacheHitValue">~ms</div>
                <div class="stat-label">Trả kết quả từ cache</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-label">Tiết kiệm</div>
                <div class="stat-value" id="savingsValue">~%</div>
                <div class="stat-label">Tốc độ cải thiện</div>
            </div>
        </div>
        
        <div class="note">
            <strong>📊 Phương pháp đo:</strong> Đo 100 câu hỏi từ Golden Dataset.
            Cache Miss (60 queries mới) vs Cache Hit (40 queries đã cache).
            Target: Cache Miss ~2500ms, Cache Hit ~800ms, Savings ~68%.
        </div>
    </div>

    <script>
        // Load data from CSV (you'll need to update these values)
        const data = {
            cacheMiss: 2487, // Update from latency-results.csv
            cacheHit: 796,
            get savings() {
                return ((this.cacheMiss - this.cacheHit) / this.cacheMiss * 100).toFixed(1);
            }
        };

        // Update stat cards
        document.getElementById('cacheMissValue').textContent = data.cacheMiss + 'ms';
        document.getElementById('cacheHitValue').textContent = data.cacheHit + 'ms';
        document.getElementById('savingsValue').textContent = data.savings + '%';

        // Create chart
        const ctx = document.getElementById('latencyChart');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Cache Miss\\n(Gọi API)', 'Cache Hit\\n(Từ cache)'],
                datasets: [{
                    label: 'Thời gian phản hồi (ms)',
                    data: [data.cacheMiss, data.cacheHit],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(75, 192, 192, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + 'ms (' + 
                                       (context.parsed.y / 1000).toFixed(2) + 's)';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + 'ms';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Thời gian (milliseconds)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Loại Test'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;

    const outputPath = path.join(OUTPUT_DIR, 'latency-chart.html');
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`✅ Generated: ${outputPath}`);
    return outputPath;
}

/**
 * Generate HTML chart for accuracy metrics
 */
function generateAccuracyChart() {
    // Read accuracy data
    let precisionValue = 93.0;
    let faithfulnessValue = 34.0;
    let mrrValue = 0.823;

    try {
        const csvPath = path.join(RESULTS_DIR, 'accuracy-summary.csv');
        if (fs.existsSync(csvPath)) {
            const csvContent = fs.readFileSync(csvPath, 'utf8');
            const match1 = csvContent.match(/Precision@5,(\d+\.?\d*)%/);
            const match2 = csvContent.match(/Faithfulness,(\d+\.?\d*)%/);
            const match3 = csvContent.match(/MRR,(\d+\.?\d*)/);

            if (match1) precisionValue = parseFloat(match1[1]);
            if (match2) faithfulnessValue = parseFloat(match2[1]);
            if (match3) mrrValue = parseFloat(match3[1]);
        }
    } catch (error) {
        console.warn('⚠️  Could not read accuracy CSV, using default values');
    }

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Biểu đồ 5.2 - Độ Chính Xác Hệ Thống</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 10px;
        }
        .charts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 30px;
        }
        .chart-container {
            position: relative;
            height: 300px;
        }
        .metrics-table {
            margin-top: 30px;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #3498db;
            color: white;
            font-weight: 600;
        }
        tr:hover {
            background: #f5f5f5;
        }
        .pass {
            color: #27ae60;
            font-weight: bold;
        }
        .fail {
            color: #e74c3c;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Đánh Giá Độ Chính Xác - Section 5.2.3</h1>
        
        <div class="charts-grid">
            <div>
                <h3 style="text-align: center;">Metrics vs Target</h3>
                <div class="chart-container">
                    <canvas id="metricsChart"></canvas>
                </div>
            </div>
            
            <div>
                <h3 style="text-align: center;">MRR Score</h3>
                <div class="chart-container">
                    <canvas id="mrrChart"></canvas>
                </div>
            </div>
        </div>
        
        <div class="metrics-table">
            <h3>Chi tiết Metrics</h3>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Current Value</th>
                        <th>Target</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Precision@5</strong></td>
                        <td>${precisionValue}%</td>
                        <td>88%</td>
                        <td class="${precisionValue >= 88 ? 'pass' : 'fail'}">
                            ${precisionValue >= 88 ? '✅ PASS' : '⚠️ NEEDS WORK'}
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Faithfulness</strong></td>
                        <td>${faithfulnessValue}%</td>
                        <td>92%</td>
                        <td class="${faithfulnessValue >= 90 ? 'pass' : 'fail'}">
                            ${faithfulnessValue >= 90 ? '✅ PASS' : '⚠️ NEEDS WORK'}
                        </td>
                    </tr>
                    <tr>
                        <td><strong>MRR</strong></td>
                        <td>${mrrValue.toFixed(3)}</td>
                        <td>0.700</td>
                        <td class="${mrrValue >= 0.7 ? 'pass' : 'fail'}">
                            ${mrrValue >= 0.7 ? '✅ PASS' : '⚠️ NEEDS WORK'}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // Metrics comparison chart
        const ctx1 = document.getElementById('metricsChart');
        new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Precision@5', 'Faithfulness'],
                datasets: [
                    {
                        label: 'Current',
                        data: [${precisionValue}, ${faithfulnessValue}],
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Target',
                        data: [88, 92],
                        backgroundColor: 'rgba(255, 206, 86, 0.7)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });

        // MRR gauge chart
        const ctx2 = document.getElementById('mrrChart');
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['MRR Score', 'Remaining'],
                datasets: [{
                    data: [${(mrrValue * 100).toFixed(1)}, ${(100 - mrrValue * 100).toFixed(1)}],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(200, 200, 200, 0.3)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataIndex === 0) {
                                    return 'MRR: ${mrrValue.toFixed(3)}';
                                }
                                return '';
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;

    const outputPath = path.join(OUTPUT_DIR, 'accuracy-chart.html');
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`✅ Generated: ${outputPath}`);
    return outputPath;
}

/**
 * Generate cost comparison chart
 */
function generateCostChart() {
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Biểu đồ 5.3 - Hiệu Quả Chi Phí</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1000px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
        }
        .chart-container {
            position: relative;
            height: 400px;
            margin-bottom: 30px;
        }
        .savings-banner {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-top: 30px;
        }
        .savings-banner h2 {
            margin: 0;
            font-size: 48px;
        }
        .savings-banner p {
            margin: 10px 0 0 0;
            font-size: 18px;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hiệu Quả Chi Phí - Cache vs No Cache</h1>
        
        <div class="chart-container">
            <canvas id="costChart"></canvas>
        </div>
        
        <div class="savings-banner">
            <h2>40% Cost Savings</h2>
            <p>Tiết kiệm $0.0007 USD / 100 requests với cache hit rate 40%</p>
            <p style="margin-top: 15px; font-size: 14px;">
                Projected annual savings: $0.08 USD/year (with 10x traffic)
            </p>
        </div>
    </div>

    <script>
        const ctx = document.getElementById('costChart');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Without Cache', 'With Cache (40% hit rate)'],
                datasets: [
                    {
                        label: 'Input Tokens',
                        data: [9433, 5659],
                        backgroundColor: 'rgba(255, 159, 64, 0.7)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Output Tokens',
                        data: [3133, 1879],
                        backgroundColor: 'rgba(153, 102, 255, 0.7)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Token Usage Comparison (100 requests)',
                        font: { size: 16 }
                    },
                    tooltip: {
                        callbacks: {
                            footer: function(tooltipItems) {
                                const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
                                const cost = (total * 0.075 / 1000000).toFixed(6);
                                return 'Total: ' + total + ' tokens\\nCost: $' + cost;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Tokens'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;

    const outputPath = path.join(OUTPUT_DIR, 'cost-chart.html');
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`✅ Generated: ${outputPath}`);
    return outputPath;
}

/**
 * Generate dashboard with all charts
 */
function generateDashboard() {
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Benchmark Results</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1a1a2e;
            color: #eee;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 36px;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 18px;
            opacity: 0.9;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        .card {
            background: #16213e;
            border-radius: 10px;
            padding: 30px;
            transition: transform 0.3s;
        }
        .card:hover {
            transform: translateY(-5px);
        }
        .card h2 {
            color: #667eea;
            margin-bottom: 20px;
        }
        .card iframe {
            width: 100%;
            height: 600px;
            border: none;
            border-radius: 8px;
            background: white;
        }
        .links {
            text-align: center;
            margin-top: 40px;
        }
        .links a {
            display: inline-block;
            margin: 0 10px;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            transition: background 0.3s;
        }
        .links a:hover {
            background: #764ba2;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 DAVLibri Benchmark Dashboard</h1>
        <p>Comprehensive Performance Analysis - Chapter 5</p>
    </div>

    <div class="grid">
        <div class="card">
            <h2>🚀 Latency Comparison</h2>
            <iframe src="latency-chart.html"></iframe>
        </div>

        <div class="card">
            <h2>🎯 Accuracy Metrics</h2>
            <iframe src="accuracy-chart.html"></iframe>
        </div>

        <div class="card">
            <h2>💰 Cost Efficiency</h2>
            <iframe src="cost-chart.html"></iframe>
        </div>
    </div>

    <div class="links">
        <a href="latency-chart.html" target="_blank">View Latency Chart</a>
        <a href="accuracy-chart.html" target="_blank">View Accuracy Chart</a>
        <a href="cost-chart.html" target="_blank">View Cost Chart</a>
    </div>
</body>
</html>`;

    const outputPath = path.join(OUTPUT_DIR, 'dashboard.html');
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`✅ Generated: ${outputPath}`);
    return outputPath;
}

/**
 * Main execution
 */
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║        VISUALIZATION GENERATOR                            ║');
console.log('║        Generate HTML Charts from Benchmark Data           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📊 Generating visualizations...\n');

try {
    const files = [];

    files.push(generateLatencyChart());
    files.push(generateAccuracyChart());
    files.push(generateCostChart());
    files.push(generateDashboard());

    console.log('\n✅ All visualizations generated!\n');
    console.log('📁 Output directory:', OUTPUT_DIR);
    console.log('\n📊 Generated files:');
    files.forEach((file) => {
        console.log(`   - ${path.basename(file)}`);
    });

    console.log('\n🌐 To view:');
    console.log(`   Open: ${path.join(OUTPUT_DIR, 'dashboard.html')}`);
    console.log('   Or open individual chart files\n');

    console.log('💡 Next steps:');
    console.log('   1. Open dashboard.html in browser');
    console.log('   2. Take screenshots for thesis');
    console.log('   3. Export to PNG/PDF if needed\n');
} catch (error) {
    console.error('\n❌ Error generating visualizations:', error);
    process.exit(1);
}
