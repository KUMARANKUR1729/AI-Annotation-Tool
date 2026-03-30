"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openReportPanel = openReportPanel;
const vscode = require("vscode");
const reportGenerator_1 = require("../core/reportGenerator");
const os = require("os");
async function openReportPanel() {
    const blocks = await (0, reportGenerator_1.extractWorkspaceBlocks)();
    const html = generateHTML(blocks);
    const filePath = vscode.Uri.file(`${os.tmpdir()}/ai-report.html`);
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(html));
    require('child_process').exec(`start chrome "${filePath.fsPath}"`);
}
function generateHTML(blocks) {
    const empMap = {};
    let totalLines = 0;
    blocks.forEach(b => {
        totalLines += b.lines;
        if (!empMap[b.employeeId])
            empMap[b.employeeId] = 0;
        empMap[b.employeeId] += b.lines;
    });
    return `
<html>
<head>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>
body {
    font-family: 'Segoe UI';
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: white;
    margin: 0;
}

.container {
    max-width: 1200px;
    margin: auto;
    padding: 20px;
}

h1 {
    color: #38bdf8;
}

.card {
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(10px);
    padding: 15px;
    margin: 10px;
    border-radius: 12px;
    display: inline-block;
}

.controls {
    margin-top: 20px;
}

select, input, button {
    padding: 10px;
    margin-right: 10px;
    border-radius: 6px;
    border: none;
}

button {
    background: #38bdf8;
    color: black;
    cursor: pointer;
}

.chart-container {
    width: 400px;
    margin: 40px auto;
}

table {
    width: 100%;
    margin-top: 20px;
    border-collapse: collapse;
}

th, td {
    padding: 10px;
    border-bottom: 1px solid #334155;
}

tr:hover {
    background: #1e293b;
    cursor: pointer;
}
</style>

</head>

<body>

<div class="container">

<h1>🚀 AI Dashboard</h1>

<h2>📊 Total AI Lines: ${totalLines}</h2>

<div>
${Object.entries(empMap).map(([id, lines]) => `
    <div class="card">
        <h3>${id}</h3>
        <p>${lines} lines</p>
    </div>
`).join("")}
</div>

<div class="controls">
    <select id="chartType" onchange="switchChart()">
        <option value="pie">Pie Chart</option>
        <option value="bar">Bar Chart</option>
    </select>

    <input id="filter" placeholder="Search file..." onkeyup="filterTable()" />

    <button onclick="downloadReport()">⬇ Download Report</button>
</div>

<div class="chart-container">
    <canvas id="chart"></canvas>
</div>

<table>
<thead>
<tr>
<th>#</th>
<th>Employee</th>
<th>Date</th>
<th>File</th>
<th>Lines</th>
</tr>
</thead>
<tbody>
${blocks.map((b, i) => `
<tr onclick="showDetails(${i})">
<td>${i + 1}</td>
<td>${b.employeeId}</td>
<td>${b.date}</td>
<td>${b.file}</td>
<td>${b.lines}</td>
</tr>
`).join("")}
</tbody>
</table>

</div>

<script>

const blocks = ${JSON.stringify(blocks)};
const empMap = ${JSON.stringify(empMap)};

let chart;

function renderChart(type) {

    const ctx = document.getElementById("chart");

    if (chart) chart.destroy();

    if (type === "pie") {
        chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(empMap),
                datasets: [{
                    data: Object.values(empMap)
                }]
            }
        });
    }

    if (type === "bar") {
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: blocks.map(b => b.file),
                datasets: [{
                    data: blocks.map(b => b.lines)
                }]
            }
        });
    }
}

function switchChart() {
    const type = document.getElementById("chartType").value;
    renderChart(type);
}

function showDetails(i) {
    const b = blocks[i];
    alert(
        "File: " + b.file +
        "\\nEmployee: " + b.employeeId +
        "\\nLines: " + b.lines +
        "\\nEditedBy: " + b.editedBy.join(", ")
    );
}

function filterTable() {
    const val = document.getElementById("filter").value.toLowerCase();
    document.querySelectorAll("tbody tr").forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(val) ? "" : "none";
    });
}

function downloadReport() {
    const blob = new Blob([document.documentElement.outerHTML], {type: "text/html"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "AI_Report.html";
    a.click();
}

// Default chart
renderChart("pie");

</script>

</body>
</html>
`;
}
//# sourceMappingURL=reportPanel.js.map