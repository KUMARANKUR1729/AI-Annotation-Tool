"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openReportPanel = openReportPanel;
const vscode = require("vscode");
const reportGenerator_1 = require("../core/reportGenerator");
const aiTracker_1 = require("../core/aiTracker");
const persistenceService_1 = require("../services/persistenceService");
let panel;
async function openReportPanel() {
    if (panel) {
        panel.reveal(vscode.ViewColumn.One);
        await refreshPanel();
        return;
    }
    panel = vscode.window.createWebviewPanel('aiDashboard', 'AI Annotator Dashboard', vscode.ViewColumn.One, { enableScripts: true, retainContextWhenHidden: true });
    panel.onDidDispose(() => { panel = undefined; });
    panel.webview.onDidReceiveMessage(async (msg) => {
        switch (msg.command) {
            case 'refresh':
                await refreshPanel();
                break;
            case 'saveSettings':
                if (msg.threshold !== undefined) {
                    (0, persistenceService_1.saveRiskThreshold)(Number(msg.threshold));
                }
                if (msg.teamConfig !== undefined) {
                    (0, persistenceService_1.saveTeamConfig)(msg.teamConfig);
                }
                if (msg.extensions !== undefined) {
                    (0, persistenceService_1.saveScanExtensions)(msg.extensions);
                }
                vscode.window.showInformationMessage('Settings saved.');
                await refreshPanel();
                break;
            case 'exportCSV':
                await exportCSV(msg.blocks);
                break;
        }
    });
    await refreshPanel();
}
async function refreshPanel() {
    if (!panel) {
        return;
    }
    panel.webview.postMessage({ command: 'loading' });
    const blocks = await (0, reportGenerator_1.extractWorkspaceBlocks)();
    const { totalAI, totalAll } = await (0, aiTracker_1.updateWorkspaceAIStats)();
    (0, persistenceService_1.saveSnapshot)(blocks, totalAll, totalAI);
    const snapshots = (0, persistenceService_1.getSnapshots)();
    const teamConfig = (0, persistenceService_1.getTeamConfig)();
    const threshold = (0, persistenceService_1.getRiskThreshold)();
    const extensions = (0, persistenceService_1.getScanExtensions)();
    panel.webview.html = generateHTML(blocks, snapshots, teamConfig, threshold, extensions, totalAI, totalAll);
}
async function exportCSV(blocks) {
    const header = 'Employee,Date,File,Lines,EditedBy,Hash\n';
    const rows = blocks.map((b) => `${b.employeeId},${b.date},"${b.file}",${b.lines},"${b.editedBy.join(' | ')}",${b.hash || ''}`).join('\n');
    const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file('ai-report.csv'),
        filters: { 'CSV': ['csv'] }
    });
    if (uri) {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(header + rows));
        vscode.window.showInformationMessage(`Exported to ${uri.fsPath}`);
    }
}
function generateHTML(blocks, snapshots, teamConfig, threshold, extensions, totalAI, totalAll) {
    // ── Aggregations ────────────────────────────────────────────────────────────
    const totalBlocks = blocks.length;
    const wsPercent = totalAll > 0 ? ((totalAI / totalAll) * 100).toFixed(1) : '0.0';
    const empMap = {};
    const fileMap = {};
    const empSet = new Set();
    blocks.forEach(b => {
        empMap[b.employeeId] = (empMap[b.employeeId] || 0) + b.lines;
        fileMap[b.file] = (fileMap[b.file] || 0) + b.lines;
        empSet.add(b.employeeId);
    });
    const fileTotalLines = {};
    blocks.forEach(b => { fileTotalLines[b.file] = (fileTotalLines[b.file] || 0) + b.lines; });
    const uniqueFiles = Object.keys(fileMap).length;
    const uniqueContributors = empSet.size;
    // Anomalies — employee with most lines today
    const today = new Date().toISOString().split('T')[0];
    const todayEmpMap = {};
    blocks.filter(b => {
        const [d, m, y] = b.date.split('-');
        return `${y}-${m}-${d}` === today;
    }).forEach(b => { todayEmpMap[b.employeeId] = (todayEmpMap[b.employeeId] || 0) + b.lines; });
    const anomalies = Object.entries(todayEmpMap)
        .filter(([, lines]) => lines > 150)
        .map(([id, lines]) => ({ id, lines }));
    // Trend data (last 14 days)
    const trendLabels = [];
    const trendData = [];
    const last14 = snapshots.slice(-14);
    last14.forEach(s => {
        trendLabels.push(s.date);
        trendData.push(s.aiLines);
    });
    // Team rollup
    const teamMap = {};
    Object.entries(empMap).forEach(([emp, lines]) => {
        const team = teamConfig[emp] || 'Unassigned';
        teamMap[team] = (teamMap[team] || 0) + lines;
    });
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none';
               script-src 'unsafe-inline' https://cdn.jsdelivr.net;
               style-src  'unsafe-inline';
               img-src    data: 'self';">
<title>AI Annotator Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f172a;--surface:#1e293b;--surface2:#263348;
  --accent:#38bdf8;--accent2:#818cf8;--accent3:#34d399;
  --danger:#f87171;--warn:#fbbf24;--text:#e2e8f0;--muted:#94a3b8;
  --radius:12px;--shadow:0 4px 24px rgba(0,0,0,.4);
}
body{font-family:'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}

/* ── NAV ── */
nav{display:flex;align-items:center;justify-content:space-between;
    padding:14px 28px;background:var(--surface);
    border-bottom:1px solid #334155;position:sticky;top:0;z-index:100}
.nav-logo{display:flex;align-items:center;gap:10px;font-size:1.1rem;font-weight:700;color:var(--accent)}
.nav-logo svg{width:26px;height:26px}
.nav-actions{display:flex;gap:10px}

/* ── TABS ── */
.tabs{display:flex;gap:4px;padding:16px 28px 0;background:var(--surface);border-bottom:1px solid #334155}
.tab{padding:10px 20px;border-radius:8px 8px 0 0;cursor:pointer;font-size:.9rem;
     color:var(--muted);border:none;background:transparent;transition:.2s}
.tab.active{background:var(--bg);color:var(--accent);font-weight:600}
.tab-panel{display:none;padding:24px 28px}
.tab-panel.active{display:block}

/* ── BUTTONS ── */
.btn{padding:8px 16px;border-radius:8px;border:none;cursor:pointer;font-size:.85rem;font-weight:600;transition:.2s}
.btn-primary{background:var(--accent);color:#0f172a}
.btn-primary:hover{background:#7dd3fc}
.btn-outline{background:transparent;color:var(--accent);border:1px solid var(--accent)}
.btn-outline:hover{background:rgba(56,189,248,.1)}
.btn-danger{background:transparent;color:var(--danger);border:1px solid var(--danger)}
.btn-sm{padding:5px 12px;font-size:.8rem}

/* ── KPI CARDS ── */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px}
.kpi-card{background:var(--surface);border-radius:var(--radius);padding:20px;
          border:1px solid #334155;position:relative;overflow:hidden}
.kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.kpi-card.blue::before{background:var(--accent)}
.kpi-card.purple::before{background:var(--accent2)}
.kpi-card.green::before{background:var(--accent3)}
.kpi-card.red::before{background:var(--danger)}
.kpi-card.yellow::before{background:var(--warn)}
.kpi-label{font-size:.78rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
.kpi-value{font-size:2rem;font-weight:700}
.kpi-sub{font-size:.78rem;color:var(--muted);margin-top:4px}

/* ── FILTER BAR ── */
.filter-bar{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px;
            background:var(--surface);padding:16px;border-radius:var(--radius);
            border:1px solid #334155}
.filter-bar input,.filter-bar select{
    background:var(--surface2);border:1px solid #475569;color:var(--text);
    padding:8px 12px;border-radius:8px;font-size:.85rem;min-width:160px}
.filter-bar input:focus,.filter-bar select:focus{outline:none;border-color:var(--accent)}
.filter-bar label{font-size:.78rem;color:var(--muted);display:block;margin-bottom:3px}

/* ── CHARTS ── */
.charts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px;margin-bottom:24px}
.chart-card{background:var(--surface);border-radius:var(--radius);padding:20px;border:1px solid #334155}
.chart-title{font-size:.9rem;font-weight:600;color:var(--muted);margin-bottom:16px;text-transform:uppercase;letter-spacing:.05em}
.chart-wrap{position:relative;height:260px}

/* ── TABLE ── */
.table-card{background:var(--surface);border-radius:var(--radius);border:1px solid #334155;overflow:hidden}
.table-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #334155}
.table-title{font-weight:600}
.table-actions{display:flex;gap:8px;align-items:center}
table{width:100%;border-collapse:collapse}
thead{background:var(--surface2)}
th{padding:11px 14px;text-align:left;font-size:.78rem;color:var(--muted);
   text-transform:uppercase;letter-spacing:.05em;cursor:pointer;user-select:none;white-space:nowrap}
th:hover{color:var(--accent)}
th .sort-icon{margin-left:4px;opacity:.5}
td{padding:11px 14px;border-top:1px solid #1e293b;font-size:.85rem}
tbody tr{transition:.15s;cursor:pointer}
tbody tr:hover{background:var(--surface2)}

/* ── RISK BADGES ── */
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;
       border-radius:999px;font-size:.72rem;font-weight:700;text-transform:uppercase}
.badge-high{background:rgba(248,113,113,.15);color:var(--danger);border:1px solid rgba(248,113,113,.3)}
.badge-med{background:rgba(251,191,36,.15);color:var(--warn);border:1px solid rgba(251,191,36,.3)}
.badge-low{background:rgba(52,211,153,.15);color:var(--accent3);border:1px solid rgba(52,211,153,.3)}

/* ── PAGINATION ── */
.pagination{display:flex;align-items:center;justify-content:space-between;
            padding:12px 20px;border-top:1px solid #334155;font-size:.83rem;color:var(--muted)}
.page-btns{display:flex;gap:6px}
.page-btn{width:32px;height:32px;border-radius:6px;border:1px solid #334155;
          background:transparent;color:var(--text);cursor:pointer;font-size:.82rem}
.page-btn.active{background:var(--accent);color:#0f172a;border-color:var(--accent)}
.page-btn:hover:not(.active){background:var(--surface2)}

/* ── DRAWER ── */
.drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:none;backdrop-filter:blur(2px)}
.drawer{position:fixed;right:0;top:0;bottom:0;width:420px;background:var(--surface);
        z-index:201;transform:translateX(100%);transition:.3s cubic-bezier(.4,0,.2,1);
        display:flex;flex-direction:column;border-left:1px solid #334155;overflow-y:auto}
.drawer.open{transform:translateX(0)}
.drawer-header{display:flex;align-items:center;justify-content:space-between;
               padding:20px;border-bottom:1px solid #334155;position:sticky;top:0;background:var(--surface)}
.drawer-body{padding:20px;flex:1}
.drawer-close{background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.2rem;padding:4px}
.drawer-close:hover{color:var(--text)}
.detail-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1e293b;font-size:.87rem}
.detail-label{color:var(--muted)}
.timeline{margin-top:16px}
.timeline-item{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #1e293b}
.timeline-dot{width:10px;height:10px;border-radius:50%;background:var(--accent);margin-top:4px;flex-shrink:0}
.timeline-text{font-size:.83rem}
.timeline-date{font-size:.75rem;color:var(--muted)}

/* ── EMPLOYEE CARDS ── */
.emp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.emp-card{background:var(--surface);border-radius:var(--radius);padding:20px;
          border:1px solid #334155;cursor:pointer;transition:.2s}
.emp-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:var(--shadow)}
.emp-name{font-size:1rem;font-weight:700;margin-bottom:4px}
.emp-team{font-size:.78rem;color:var(--accent2);margin-bottom:12px}
.emp-stats{display:flex;gap:16px;margin-bottom:12px}
.emp-stat{text-align:center}
.emp-stat-val{font-size:1.3rem;font-weight:700;color:var(--accent)}
.emp-stat-label{font-size:.72rem;color:var(--muted)}
.progress-bar{height:6px;background:#334155;border-radius:999px;overflow:hidden}
.progress-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--accent),var(--accent2));transition:.4s}

/* ── FILE CARDS ── */
.file-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.file-card{background:var(--surface);border-radius:var(--radius);padding:18px;border:1px solid #334155}
.file-card.risk-high{border-color:rgba(248,113,113,.4)}
.file-card.risk-med{border-color:rgba(251,191,36,.4)}
.file-card.risk-low{border-color:rgba(52,211,153,.4)}
.file-name{font-size:.85rem;font-weight:600;margin-bottom:8px;word-break:break-all}
.file-meta{display:flex;justify-content:space-between;align-items:center;margin-top:10px}

/* ── ANOMALY ALERTS ── */
.alert-box{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.3);
           border-radius:var(--radius);padding:14px 18px;margin-bottom:20px;display:flex;gap:12px;align-items:flex-start}
.alert-icon{font-size:1.2rem;flex-shrink:0}
.alert-text{font-size:.85rem;line-height:1.5}

/* ── SETTINGS ── */
.settings-section{background:var(--surface);border-radius:var(--radius);padding:24px;
                  border:1px solid #334155;margin-bottom:20px}
.settings-title{font-weight:700;margin-bottom:16px;color:var(--accent)}
.form-group{margin-bottom:16px}
.form-label{font-size:.85rem;color:var(--muted);display:block;margin-bottom:6px}
.form-input{width:100%;background:var(--surface2);border:1px solid #475569;color:var(--text);
            padding:9px 12px;border-radius:8px;font-size:.875rem}
.form-input:focus{outline:none;border-color:var(--accent)}
.range-wrap{display:flex;align-items:center;gap:12px}
.range-wrap input[type=range]{flex:1;accent-color:var(--accent)}
.range-val{min-width:40px;text-align:center;font-weight:700;color:var(--accent)}
.team-row{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:center}

/* ── TOAST ── */
.toast-container{position:fixed;top:20px;right:20px;z-index:300;display:flex;flex-direction:column;gap:8px}
.toast{background:var(--surface2);border:1px solid #334155;border-radius:10px;
       padding:12px 18px;font-size:.85rem;box-shadow:var(--shadow);
       animation:slideIn .3s ease;display:flex;gap:10px;align-items:center;min-width:260px}
.toast.success{border-color:rgba(52,211,153,.4)}
.toast.error{border-color:rgba(248,113,113,.4)}
@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}

/* ── MISC ── */
.section-title{font-size:1rem;font-weight:700;color:var(--text);margin-bottom:16px}
.empty{text-align:center;padding:40px;color:var(--muted);font-size:.9rem}
.trend-row{display:flex;justify-content:space-between;font-size:.82rem;padding:6px 0;border-bottom:1px solid #1e293b}
.col-toggle{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.col-toggle label{display:flex;align-items:center;gap:5px;font-size:.78rem;color:var(--muted);cursor:pointer}

@media(max-width:700px){
  .charts-grid{grid-template-columns:1fr}
  .kpi-grid{grid-template-columns:repeat(2,1fr)}
  .drawer{width:100%}
}
</style>
</head>
<body>

<!-- Toast Container -->
<div class="toast-container" id="toastContainer"></div>

<!-- Drawer Overlay -->
<div class="drawer-overlay" id="drawerOverlay" onclick="closeDrawer()"></div>
<div class="drawer" id="drawer">
  <div class="drawer-header">
    <strong id="drawerTitle">Block Details</strong>
    <button class="drawer-close" onclick="closeDrawer()">✕</button>
  </div>
  <div class="drawer-body" id="drawerBody"></div>
</div>

<!-- Nav -->
<nav>
  <div class="nav-logo">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
    AI Annotator
    <span style="font-size:.72rem;color:var(--muted);font-weight:400">Enterprise Dashboard</span>
  </div>
  <div class="nav-actions">
    <button class="btn btn-outline btn-sm" onclick="exportCSV()">⬇ Export CSV</button>
    <button class="btn btn-outline btn-sm" onclick="exportPDF()">🖨 Print / PDF</button>
    <button class="btn btn-primary btn-sm" onclick="refresh()">⟳ Refresh</button>
  </div>
</nav>

<!-- Tabs -->
<div class="tabs">
  <button class="tab active" onclick="switchTab('overview',this)">📊 Overview</button>
  <button class="tab" onclick="switchTab('employees',this)">👥 Employees</button>
  <button class="tab" onclick="switchTab('files',this)">📁 Files</button>
  <button class="tab" onclick="switchTab('trends',this)">📈 Trends</button>
  <button class="tab" onclick="switchTab('settings',this)">⚙ Settings</button>
</div>

<!-- ══════════════════════════════════════════════════════════════
     OVERVIEW TAB
════════════════════════════════════════════════════════════════ -->
<div class="tab-panel active" id="tab-overview">

  ${anomalies.length > 0 ? `
  <div class="alert-box">
    <span class="alert-icon">⚠</span>
    <div class="alert-text">
      <strong>Anomaly Detected</strong> — High AI activity today:<br>
      ${anomalies.map(a => `<strong>${a.id}</strong> added ${a.lines} AI lines`).join(', ')}
    </div>
  </div>` : ''}

  <!-- KPI Cards -->
  <div class="kpi-grid">
    <div class="kpi-card blue">
      <div class="kpi-label">Total AI Blocks</div>
      <div class="kpi-value">${totalBlocks}</div>
      <div class="kpi-sub">across all files</div>
    </div>
    <div class="kpi-card purple">
      <div class="kpi-label">Files Affected</div>
      <div class="kpi-value">${uniqueFiles}</div>
      <div class="kpi-sub">with AI annotations</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-label">Contributors</div>
      <div class="kpi-value">${uniqueContributors}</div>
      <div class="kpi-sub">unique employees</div>
    </div>
    <div class="kpi-card ${parseFloat(wsPercent) > threshold ? 'red' : parseFloat(wsPercent) > threshold * 0.5 ? 'yellow' : 'green'}">
      <div class="kpi-label">Workspace AI %</div>
      <div class="kpi-value">${wsPercent}%</div>
      <div class="kpi-sub">${totalAI} of ${totalAll} lines</div>
    </div>
    <div class="kpi-card blue">
      <div class="kpi-label">Total AI Lines</div>
      <div class="kpi-value">${blocks.reduce((s, b) => s + b.lines, 0)}</div>
      <div class="kpi-sub">annotated lines</div>
    </div>
  </div>

  <!-- Charts -->
  <div class="charts-grid">
    <div class="chart-card">
      <div class="chart-title">AI Lines by Employee</div>
      <div class="chart-wrap"><canvas id="pieChart"></canvas></div>
    </div>
    <div class="chart-card">
      <div class="chart-title">AI Lines by File (Top 10)</div>
      <div class="chart-wrap"><canvas id="barChart"></canvas></div>
    </div>
    ${Object.keys(teamConfig).length > 0 ? `
    <div class="chart-card">
      <div class="chart-title">AI Lines by Team</div>
      <div class="chart-wrap"><canvas id="teamChart"></canvas></div>
    </div>` : ''}
  </div>

  <!-- Filters -->
  <div class="filter-bar">
    <div>
      <label>Employee</label>
      <select id="fEmployee" onchange="applyFilters()">
        <option value="">All Employees</option>
        ${[...empSet].map(e => `<option value="${e}">${e}</option>`).join('')}
      </select>
    </div>
    <div>
      <label>From Date</label>
      <input type="date" id="fFrom" onchange="applyFilters()"/>
    </div>
    <div>
      <label>To Date</label>
      <input type="date" id="fTo" onchange="applyFilters()"/>
    </div>
    <div>
      <label>Search File</label>
      <input type="text" id="fFile" placeholder="e.g. extension.ts" oninput="applyFilters()"/>
    </div>
    <div>
      <label>Risk Level</label>
      <select id="fRisk" onchange="applyFilters()">
        <option value="">All</option>
        <option value="high">High Risk</option>
        <option value="med">Medium Risk</option>
        <option value="low">Low Risk</option>
      </select>
    </div>
    <div style="display:flex;align-items:flex-end">
      <button class="btn btn-outline btn-sm" onclick="clearFilters()">✕ Clear</button>
    </div>
  </div>

  <!-- Column Toggle -->
  <div style="margin-bottom:12px">
    <div class="col-toggle" id="colToggle">
      <span style="font-size:.78rem;color:var(--muted);margin-right:4px">Columns:</span>
      <label><input type="checkbox" checked onchange="toggleCol(0)"> #</label>
      <label><input type="checkbox" checked onchange="toggleCol(1)"> Employee</label>
      <label><input type="checkbox" checked onchange="toggleCol(2)"> Date</label>
      <label><input type="checkbox" checked onchange="toggleCol(3)"> File</label>
      <label><input type="checkbox" checked onchange="toggleCol(4)"> Lines</label>
      <label><input type="checkbox" checked onchange="toggleCol(5)"> Risk</label>
      <label><input type="checkbox" checked onchange="toggleCol(6)"> Edited By</label>
    </div>
  </div>

  <!-- Table -->
  <div class="table-card">
    <div class="table-header">
      <span class="table-title">AI Block Details</span>
      <div class="table-actions">
        <span id="rowCount" style="font-size:.82rem;color:var(--muted)"></span>
        <select id="pageSize" onchange="setPageSize()" style="background:var(--surface2);border:1px solid #475569;color:var(--text);padding:5px 8px;border-radius:6px;font-size:.82rem">
          <option value="25">25 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
        </select>
      </div>
    </div>
    <div style="overflow-x:auto">
      <table id="mainTable">
        <thead>
          <tr>
            <th onclick="sortBy(0)">#<span class="sort-icon">↕</span></th>
            <th onclick="sortBy(1)">Employee<span class="sort-icon">↕</span></th>
            <th onclick="sortBy(2)">Date<span class="sort-icon">↕</span></th>
            <th onclick="sortBy(3)">File<span class="sort-icon">↕</span></th>
            <th onclick="sortBy(4)">Lines<span class="sort-icon">↕</span></th>
            <th>Risk</th>
            <th>Edited By</th>
          </tr>
        </thead>
        <tbody id="tableBody"></tbody>
      </table>
    </div>
    <div class="pagination">
      <span id="paginationInfo"></span>
      <div class="page-btns" id="pageBtns"></div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════
     EMPLOYEES TAB
════════════════════════════════════════════════════════════════ -->
<div class="tab-panel" id="tab-employees">
  <div class="section-title">Contributor Breakdown</div>
  <div class="emp-grid" id="empGrid">
  ${Object.entries(empMap).map(([id, lines]) => {
        const pct = blocks.reduce((s, b) => s + b.lines, 0) > 0
            ? ((lines / blocks.reduce((s, b) => s + b.lines, 0)) * 100).toFixed(0)
            : 0;
        const team = teamConfig[id] || 'Unassigned';
        const fileCount = new Set(blocks.filter(b => b.employeeId === id).map(b => b.file)).size;
        const lastDate = blocks.filter(b => b.employeeId === id).map(b => b.date).sort().pop() || '-';
        return `
    <div class="emp-card" onclick="showEmpDetail('${id}')">
      <div class="emp-name">👤 ${id}</div>
      <div class="emp-team">${team}</div>
      <div class="emp-stats">
        <div class="emp-stat"><div class="emp-stat-val">${lines}</div><div class="emp-stat-label">AI Lines</div></div>
        <div class="emp-stat"><div class="emp-stat-val">${fileCount}</div><div class="emp-stat-label">Files</div></div>
        <div class="emp-stat"><div class="emp-stat-val">${pct}%</div><div class="emp-stat-label">Share</div></div>
      </div>
      <div style="font-size:.75rem;color:var(--muted);margin-bottom:8px">Last active: ${lastDate}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
    }).join('')}
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════
     FILES TAB
════════════════════════════════════════════════════════════════ -->
<div class="tab-panel" id="tab-files">
  <div class="section-title">File Risk Assessment</div>
  <div class="file-grid">
  ${Object.entries(fileMap).sort(([, a], [, b]) => b - a).map(([file, lines]) => {
        const riskPct = lines;
        const riskClass = riskPct > threshold ? 'risk-high' : riskPct > threshold * 0.5 ? 'risk-med' : 'risk-low';
        const badgeClass = riskPct > threshold ? 'badge-high' : riskPct > threshold * 0.5 ? 'badge-med' : 'badge-low';
        const badgeLabel = riskPct > threshold ? 'HIGH RISK' : riskPct > threshold * 0.5 ? 'MEDIUM' : 'LOW';
        const blockCount = blocks.filter(b => b.file === file).length;
        return `
    <div class="file-card ${riskClass}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <span class="badge ${badgeClass}">● ${badgeLabel}</span>
      </div>
      <div class="file-name">📄 ${file}</div>
      <div class="file-meta">
        <span style="font-size:.82rem;color:var(--muted)">${blockCount} block${blockCount !== 1 ? 's' : ''} · ${lines} AI lines</span>
      </div>
    </div>`;
    }).join('')}
  </div>
</div>

<!-- ══════════════════════════════════════════════════════════════
     TRENDS TAB
════════════════════════════════════════════════════════════════ -->
<div class="tab-panel" id="tab-trends">
  <div class="section-title">AI Adoption Over Time (Last 14 Days)</div>
  ${trendLabels.length < 2 ? `
  <div class="empty">
    📈 Not enough history yet — open the dashboard daily to build trend data.
  </div>` : `
  <div class="chart-card" style="margin-bottom:24px">
    <div class="chart-title">Daily AI Lines Trend</div>
    <div class="chart-wrap" style="height:320px"><canvas id="trendChart"></canvas></div>
  </div>
  <div class="chart-card">
    <div class="chart-title">Snapshot History</div>
    <table style="width:100%">
      <thead><tr><th>Date</th><th>AI Lines</th><th>Total Lines</th><th>AI %</th></tr></thead>
      <tbody>
      ${[...(0, persistenceService_1.getSnapshots)()].reverse().slice(0, 20).map(s => `
        <tr>
          <td>${s.date}</td>
          <td style="color:var(--accent)">${s.aiLines}</td>
          <td>${s.totalLines}</td>
          <td>${s.aiPercent}%</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`}
</div>

<!-- ══════════════════════════════════════════════════════════════
     SETTINGS TAB
════════════════════════════════════════════════════════════════ -->
<div class="tab-panel" id="tab-settings">

  <div class="settings-section">
    <div class="settings-title">⚠ Risk Threshold</div>
    <div class="form-group">
      <label class="form-label">Files with more than this many AI lines are marked HIGH RISK</label>
      <div class="range-wrap">
        <input type="range" min="10" max="500" value="${threshold}" id="thresholdRange"
               oninput="document.getElementById('thresholdVal').textContent=this.value"/>
        <span class="range-val" id="thresholdVal">${threshold}</span>
        <span style="font-size:.8rem;color:var(--muted)">lines</span>
      </div>
    </div>
  </div>

  <div class="settings-section">
    <div class="settings-title">👥 Team / Department Mapping</div>
    <div class="form-group">
      <label class="form-label">Map Employee IDs to team names for the team chart</label>
      <div id="teamRows">
        ${Object.entries(teamConfig).map(([emp, team]) => `
        <div class="team-row">
          <input class="form-input emp-inp" placeholder="Employee ID" value="${emp}"/>
          <input class="form-input team-inp" placeholder="Team Name"  value="${team}"/>
          <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">✕</button>
        </div>`).join('')}
      </div>
      <button class="btn btn-outline btn-sm" style="margin-top:10px" onclick="addTeamRow()">+ Add Row</button>
    </div>
  </div>

  <div class="settings-section">
    <div class="settings-title">🔍 Scan File Extensions</div>
    <div class="form-group">
      <label class="form-label">Comma-separated extensions to scan for AI blocks</label>
      <input class="form-input" id="extInput" value="${extensions.join(', ')}"/>
    </div>
  </div>

  <button class="btn btn-primary" onclick="saveSettings()">💾 Save Settings</button>
</div>

<script>
// ── Data ───────────────────────────────────────────────────────
const blocks     = ${JSON.stringify(blocks)};
const empMap     = ${JSON.stringify(empMap)};
const teamMap    = ${JSON.stringify(teamMap)};
const trendLabels= ${JSON.stringify(trendLabels)};
const trendData  = ${JSON.stringify(trendData)};
const snapshots  = ${JSON.stringify((0, persistenceService_1.getSnapshots)())};
const threshold  = ${threshold};
const vscode     = acquireVsCodeApi();

// ── State ──────────────────────────────────────────────────────
let filteredBlocks = [...blocks];
let sortCol        = -1;
let sortAsc        = true;
let currentPage    = 1;
let pageSize       = 25;

// ── Tab Switching ──────────────────────────────────────────────
function switchTab(id, el) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    el.classList.add('active');
}

// ── Charts ─────────────────────────────────────────────────────
const COLORS = ['#38bdf8','#818cf8','#34d399','#fbbf24','#f87171','#a78bfa','#fb923c','#4ade80','#f472b6','#22d3ee'];

function initCharts() {
    const chartDefaults = {
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } }
    };

    // Pie
    new Chart(document.getElementById('pieChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(empMap),
            datasets: [{ data: Object.values(empMap), backgroundColor: COLORS, borderWidth: 2, borderColor: '#1e293b' }]
        },
        options: { ...chartDefaults, cutout: '60%',
            plugins: { ...chartDefaults.plugins, tooltip: { callbacks: {
                label: ctx => \` \${ctx.label}: \${ctx.parsed} lines\`
            }}}
        }
    });

    // Bar (top 10 files)
    const topFiles = Object.entries(empMap.constructor === Object
        ? Object.fromEntries(Object.entries(
            blocks.reduce((acc, b) => { acc[b.file] = (acc[b.file] || 0) + b.lines; return acc; }, {})
          ).sort(([,a],[,b]) => b - a).slice(0, 10))
        : {});
    const fileEntries = Object.entries(
        blocks.reduce((acc, b) => { acc[b.file] = (acc[b.file]||0)+b.lines; return acc; }, {})
    ).sort(([,a],[,b]) => b-a).slice(0,10);

    new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: fileEntries.map(([f]) => f.length > 20 ? '...'+f.slice(-18) : f),
            datasets: [{ label: 'AI Lines', data: fileEntries.map(([,v]) => v),
                         backgroundColor: '#38bdf8', borderRadius: 6 }]
        },
        options: { ...chartDefaults, indexAxis: 'y',
            scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                      y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } } },
            plugins: { legend: { display: false } }
        }
    });

    // Team chart (if exists)
    const teamEl = document.getElementById('teamChart');
    if (teamEl && Object.keys(teamMap).length > 0) {
        new Chart(teamEl, {
            type: 'pie',
            data: {
                labels: Object.keys(teamMap),
                datasets: [{ data: Object.values(teamMap), backgroundColor: COLORS, borderWidth: 2, borderColor: '#1e293b' }]
            },
            options: chartDefaults
        });
    }

    // Trend chart
    const trendEl = document.getElementById('trendChart');
    if (trendEl && trendLabels.length >= 2) {
        new Chart(trendEl, {
            type: 'line',
            data: {
                labels: trendLabels,
                datasets: [{
                    label: 'AI Lines', data: trendData,
                    borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,.15)',
                    tension: 0.4, fill: true, pointBackgroundColor: '#38bdf8', pointRadius: 4
                }]
            },
            options: { ...chartDefaults,
                scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
                          y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } } }
            }
        });
    }
}

// ── Table / Filter / Sort / Paginate ──────────────────────────
function applyFilters() {
    const emp   = document.getElementById('fEmployee').value.toLowerCase();
    const from  = document.getElementById('fFrom').value;
    const to    = document.getElementById('fTo').value;
    const file  = document.getElementById('fFile').value.toLowerCase();
    const risk  = document.getElementById('fRisk').value;

    filteredBlocks = blocks.filter(b => {
        if (emp  && !b.employeeId.toLowerCase().includes(emp))  { return false; }
        if (file && !b.file.toLowerCase().includes(file))       { return false; }
        if (risk) {
            const isHigh = b.lines > threshold;
            const isMed  = b.lines > threshold * 0.5 && b.lines <= threshold;
            if (risk === 'high' && !isHigh) { return false; }
            if (risk === 'med'  && !isMed)  { return false; }
            if (risk === 'low'  && (isHigh||isMed)) { return false; }
        }
        if (from || to) {
            const [d,m,y] = b.date.split('-');
            const bDate   = \`\${y}-\${m}-\${d}\`;
            if (from && bDate < from) { return false; }
            if (to   && bDate > to)   { return false; }
        }
        return true;
    });

    currentPage = 1;
    renderTable();
}

function clearFilters() {
    ['fEmployee','fFrom','fTo','fFile','fRisk'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; }
    });
    applyFilters();
}

function sortBy(col) {
    if (sortCol === col) { sortAsc = !sortAsc; } else { sortCol = col; sortAsc = true; }
    filteredBlocks.sort((a, b) => {
        const vals = [[0,0],[a.employeeId,b.employeeId],[a.date,b.date],[a.file,b.file],[a.lines,b.lines]];
        const [av, bv] = vals[col] || [0,0];
        if (av < bv) { return sortAsc ? -1 : 1; }
        if (av > bv) { return sortAsc ?  1 : -1; }
        return 0;
    });
    renderTable();
}

function setPageSize() {
    pageSize    = parseInt(document.getElementById('pageSize').value);
    currentPage = 1;
    renderTable();
}

function renderTable() {
    const total     = filteredBlocks.length;
    const pages     = Math.max(1, Math.ceil(total / pageSize));
    currentPage     = Math.min(currentPage, pages);
    const start     = (currentPage - 1) * pageSize;
    const pageBlocks= filteredBlocks.slice(start, start + pageSize);

    document.getElementById('rowCount').textContent = \`\${total} records\`;
    document.getElementById('paginationInfo').textContent =
        \`Showing \${start+1}–\${Math.min(start+pageSize,total)} of \${total}\`;

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = pageBlocks.map((b, i) => {
        const isHigh = b.lines > threshold;
        const isMed  = b.lines > threshold * 0.5;
        const badge  = isHigh
            ? '<span class="badge badge-high">● HIGH</span>'
            : isMed
            ? '<span class="badge badge-med">● MED</span>'
            : '<span class="badge badge-low">● LOW</span>';
        const edited  = b.editedBy && b.editedBy.length ? b.editedBy.join(', ') : '—';
        return \`<tr onclick="showDrawer(\${blocks.indexOf(b)})">
            <td>\${start+i+1}</td>
            <td><strong>\${b.employeeId}</strong></td>
            <td>\${b.date}</td>
            <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="\${b.file}">\${b.file}</td>
            <td>\${b.lines}</td>
            <td>\${badge}</td>
            <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="\${edited}">\${edited}</td>
        </tr>\`;
    }).join('');

    // Pagination buttons
    const btnContainer = document.getElementById('pageBtns');
    btnContainer.innerHTML = '';
    const maxBtns = 7;
    let s = Math.max(1, currentPage - 3);
    let e = Math.min(pages, s + maxBtns - 1);
    if (e - s < maxBtns - 1) { s = Math.max(1, e - maxBtns + 1); }

    if (s > 1) { btnContainer.innerHTML += pageBtn(1); if (s > 2) { btnContainer.innerHTML += '<span style="padding:0 4px;color:var(--muted)">…</span>'; } }
    for (let p = s; p <= e; p++) { btnContainer.innerHTML += pageBtn(p); }
    if (e < pages) { if (e < pages - 1) { btnContainer.innerHTML += '<span style="padding:0 4px;color:var(--muted)">…</span>'; } btnContainer.innerHTML += pageBtn(pages); }
}

function pageBtn(p) {
    return \`<button class="page-btn \${p===currentPage?'active':''}" onclick="goPage(\${p})">\${p}</button>\`;
}

function goPage(p) { currentPage = p; renderTable(); }

function toggleCol(idx) {
    document.querySelectorAll(\`#mainTable th:nth-child(\${idx+1}), #mainTable td:nth-child(\${idx+1})\`)
        .forEach(el => { el.style.display = el.style.display === 'none' ? '' : 'none'; });
}

// ── Detail Drawer ──────────────────────────────────────────────
function showDrawer(idx) {
    const b = blocks[idx];
    if (!b) { return; }
    const isHigh = b.lines > threshold;
    const isMed  = b.lines > threshold * 0.5;
    const risk   = isHigh ? '<span class="badge badge-high">● HIGH RISK</span>'
                 : isMed  ? '<span class="badge badge-med">● MEDIUM</span>'
                 :          '<span class="badge badge-low">● LOW</span>';

    document.getElementById('drawerTitle').textContent = b.file;
    document.getElementById('drawerBody').innerHTML = \`
        <div class="detail-row"><span class="detail-label">Employee</span><strong>\${b.employeeId}</strong></div>
        <div class="detail-row"><span class="detail-label">Created Date</span>\${b.date}</div>
        <div class="detail-row"><span class="detail-label">AI Lines</span>\${b.lines}</div>
        <div class="detail-row"><span class="detail-label">Risk Level</span>\${risk}</div>
        \${b.hash ? \`<div class="detail-row"><span class="detail-label">Hash</span><code style="font-size:.8rem;color:var(--accent)">\${b.hash}</code></div>\` : ''}
        <div style="margin-top:20px;margin-bottom:8px;font-weight:600;font-size:.85rem">Edit Timeline</div>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-dot" style="background:var(--accent3)"></div>
            <div><div class="timeline-text"><strong>\${b.employeeId}</strong> — created block</div>
            <div class="timeline-date">\${b.date}</div></div>
          </div>
          \${(b.editedBy || []).map(e => \`
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div><div class="timeline-text"><strong>\${e.split('(')[0].trim()}</strong> — edited</div>
            <div class="timeline-date">\${(e.match(/\\(([^)]+)\\)/)||['',''])[1]}</div></div>
          </div>\`).join('')}
        </div>\`;

    document.getElementById('drawerOverlay').style.display = 'block';
    setTimeout(() => document.getElementById('drawer').classList.add('open'), 10);
}

function closeDrawer() {
    document.getElementById('drawer').classList.remove('open');
    setTimeout(() => { document.getElementById('drawerOverlay').style.display = 'none'; }, 300);
}

// ── Employee Drill-Down ────────────────────────────────────────
function showEmpDetail(id) {
    const empBlocks = blocks.filter(b => b.employeeId === id);
    const lines     = empBlocks.reduce((s,b) => s+b.lines, 0);
    const files     = [...new Set(empBlocks.map(b => b.file))];
    document.getElementById('drawerTitle').textContent = '👤 ' + id;
    document.getElementById('drawerBody').innerHTML = \`
        <div class="detail-row"><span class="detail-label">Total AI Lines</span><strong style="color:var(--accent)">\${lines}</strong></div>
        <div class="detail-row"><span class="detail-label">Total Blocks</span>\${empBlocks.length}</div>
        <div class="detail-row"><span class="detail-label">Files Touched</span>\${files.length}</div>
        <div style="margin-top:16px;font-weight:600;font-size:.85rem;margin-bottom:8px">Files</div>
        \${files.map(f => {
            const fLines = empBlocks.filter(b => b.file===f).reduce((s,b)=>s+b.lines,0);
            return \`<div class="detail-row"><span class="detail-label" style="max-width:240px;overflow:hidden;text-overflow:ellipsis">\${f}</span><span>\${fLines} lines</span></div>\`;
        }).join('')}
        <div style="margin-top:16px;font-weight:600;font-size:.85rem;margin-bottom:8px">Blocks</div>
        \${empBlocks.map((b,i) => \`
        <div style="padding:8px 0;border-bottom:1px solid #1e293b;cursor:pointer;font-size:.83rem" onclick="closeDrawer();setTimeout(()=>showDrawer(\${blocks.indexOf(b)}),350)">
            <strong>#\${i+1}</strong> \${b.file} — \${b.lines} lines — \${b.date}
        </div>\`).join('')}\`;

    document.getElementById('drawerOverlay').style.display = 'block';
    setTimeout(() => document.getElementById('drawer').classList.add('open'), 10);
}

// ── Toast ──────────────────────────────────────────────────────
function toast(msg, type='success') {
    const t = document.createElement('div');
    t.className = \`toast \${type}\`;
    t.innerHTML = (type==='success'?'✓':'⚠') + ' ' + msg;
    document.getElementById('toastContainer').appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ── Actions ────────────────────────────────────────────────────
function refresh() {
    toast('Refreshing dashboard…');
    vscode.postMessage({ command: 'refresh' });
}

function exportCSV() {
    vscode.postMessage({ command: 'exportCSV', blocks: filteredBlocks });
}

function exportPDF() {
    window.print();
}

// ── Settings ───────────────────────────────────────────────────
function addTeamRow() {
    const row = document.createElement('div');
    row.className = 'team-row';
    row.innerHTML = \`<input class="form-input emp-inp" placeholder="Employee ID"/>
                     <input class="form-input team-inp" placeholder="Team Name"/>
                     <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">✕</button>\`;
    document.getElementById('teamRows').appendChild(row);
}

function saveSettings() {
    const threshold = parseInt(document.getElementById('thresholdRange').value);
    const teamConfig = {};
    document.querySelectorAll('.team-row').forEach(row => {
        const emp  = row.querySelector('.emp-inp').value.trim();
        const team = row.querySelector('.team-inp').value.trim();
        if (emp && team) { teamConfig[emp] = team; }
    });
    const extVal = document.getElementById('extInput').value;
    const extensions = extVal.split(',').map(e => e.trim()).filter(Boolean);

    vscode.postMessage({ command: 'saveSettings', threshold, teamConfig, extensions });
    toast('Settings saved!');
}

// ── Init ───────────────────────────────────────────────────────
initCharts();
applyFilters();

// Handle messages from extension
window.addEventListener('message', e => {
    if (e.data.command === 'loading') { toast('Loading data…'); }
});
</script>

<style>
@media print {
  nav, .tabs, .nav-actions, .filter-bar, .drawer, .drawer-overlay,
  .toast-container, .pagination, .col-toggle, .table-actions { display: none !important; }
  body { background: white; color: black; }
  .tab-panel { display: block !important; }
  .kpi-card, .chart-card, .table-card { break-inside: avoid; }
}
</style>
</body>
</html>`;
}
//# sourceMappingURL=reportPanel.js.map