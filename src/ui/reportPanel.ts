import * as vscode from 'vscode';
import { extractAIBlocks } from '../core/reportGenerator';

export async function openReportPanel() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const blocks = extractAIBlocks(editor.document);
    const html = generateHTML(blocks);

    const filePath = vscode.Uri.file(
        `${require('os').tmpdir()}/ai-report.html`
    );

    await vscode.workspace.fs.writeFile(filePath, Buffer.from(html));

    require('child_process').exec(`start chrome "${filePath.fsPath}"`);
}

function generateHTML(blocks: any[]) {

    // =========================
    // DATA PROCESSING
    // =========================
    const empMap: any = {};
    const fileMap: any = {};

    let totalLines = 0;

    blocks.forEach(b => {
        totalLines += b.lines;

        empMap[b.employeeId] = (empMap[b.employeeId] || 0) + b.lines;
        fileMap[b.file] = (fileMap[b.file] || 0) + b.lines;
    });

    const topEmp = Object.entries(empMap).sort((a: any, b: any) => b[1] - a[1])[0];

    // =========================
    // INSIGHT CARDS
    // =========================
    const cards = `
    <div class="cards">
        <div class="card">📊 Total AI Lines<br><b>${totalLines}</b></div>
        <div class="card">👨‍💻 Top Employee<br><b>${topEmp ? topEmp[0] : "-"}</b></div>
        <div class="card">📁 Files<br><b>${Object.keys(fileMap).length}</b></div>
    </div>
    `;

    // =========================
    // TABLE ROWS
    // =========================
    let rows = "";
    blocks.forEach((b, i) => {
        const tag = b.editedBy.length > 0 ? "edited" : "new";

        rows += `
        <tr onclick="openDetails(${i})">
            <td>${i + 1}</td>
            <td>${b.employeeId}</td>
            <td>${b.date}</td>
            <td>${b.editedBy.join(", ") || "-"}</td>
            <td>${b.file.split("\\").pop()}</td>
            <td>
                <div class="progress">
                    <div style="width:${(b.lines / totalLines) * 100}%"></div>
                </div>
                ${b.lines}
            </td>
            <td><span class="${tag}">${tag.toUpperCase()}</span></td>
        </tr>
        `;
    });

    // =========================
    // HTML
    // =========================
    return `
<html>
<head>
<title>AI Dashboard</title>

<style>
body {
    font-family: 'Segoe UI';
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: white;
    padding: 20px;
}

/* Cards */
.cards {
    display: flex;
    gap: 20px;
}

.card {
    background: rgba(255,255,255,0.05);
    padding: 20px;
    border-radius: 10px;
    backdrop-filter: blur(10px);
}

/* Table */
table {
    width: 100%;
    margin-top: 20px;
}

th, td {
    padding: 10px;
}

/* Progress bar */
.progress {
    background: #334155;
    height: 6px;
    border-radius: 5px;
}
.progress div {
    height: 6px;
    background: #38bdf8;
}

/* Tags */
.new {
    color: #38bdf8;
}
.edited {
    color: #facc15;
}

/* Charts */
.chart-box {
    width: 300px;
    margin-top: 20px;
}

/* Details panel */
#details {
    margin-top: 20px;
    padding: 20px;
    background: #1e293b;
    border-radius: 10px;
    display: none;
}

/* Search */
input {
    padding: 10px;
    width: 300px;
    margin-top: 20px;
}
</style>

<script>
const data = ${JSON.stringify(blocks)};

// FILTER
function filterTable() {
    const val = document.getElementById("search").value.toLowerCase();
    document.querySelectorAll("tbody tr").forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(val) ? "" : "none";
    });
}

// DETAILS PANEL
function openDetails(i) {
    const b = data[i];
    document.getElementById("details").style.display = "block";
    document.getElementById("details").innerHTML =
        "<h3>📄 File Details</h3>" +
        "File: " + b.file + "<br>" +
        "Employee: " + b.employeeId + "<br>" +
        "Lines: " + b.lines + "<br>" +
        "EditedBy: " + b.editedBy.join(", ");
}

// DOWNLOAD JSON
function downloadJSON() {
    const blob = new Blob([JSON.stringify(data)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "report.json";
    a.click();
}
</script>

</head>

<body>

<h1>🚀 AI Code Dashboard</h1>

${cards}

<input id="search" onkeyup="filterTable()" placeholder="Search employee/file...">

<h2>📂 File Details</h2>

<table>
<thead>
<tr>
<th>#</th>
<th>Employee</th>
<th>Date</th>
<th>EditedBy</th>
<th>File</th>
<th>Lines</th>
<th>Status</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>

<div id="details"></div>

<h2>📊 Charts</h2>

<div class="chart-box">
<canvas id="pie"></canvas>
</div>

<div class="chart-box">
<canvas id="bar"></canvas>
</div>

<button onclick="downloadJSON()">⬇ Download JSON</button>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>

// PIE (SMALL SIZE FIXED)
new Chart(document.getElementById('pie'), {
    type: 'pie',
    data: {
        labels: Object.keys(${JSON.stringify(empMap)}),
        datasets: [{
            data: Object.values(${JSON.stringify(empMap)}),
            backgroundColor: ['#38bdf8','#facc15','#ef4444','#22c55e']
        }]
    },
    options: {
        responsive: false,
        width: 300,
        height: 300
    }
});

// BAR
new Chart(document.getElementById('bar'), {
    type: 'bar',
    data: {
        labels: Object.keys(${JSON.stringify(fileMap)}),
        datasets: [{
            data: Object.values(${JSON.stringify(fileMap)}),
            backgroundColor: '#38bdf8'
        }]
    },
    options: {
        responsive: false,
        width: 300,
        height: 300
    }
});
</script>

</body>
</html>
`;
}