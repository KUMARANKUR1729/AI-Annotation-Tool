"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAIStats = updateAIStats;
exports.updateWorkspaceAIStats = updateWorkspaceAIStats;
exports.countLines = countLines;
const vscode = require("vscode");
const fs = require("fs");
const statusBar_1 = require("../ui/statusBar");
const persistenceService_1 = require("../services/persistenceService");
// FIX #4 — Line matching uses anchored startsWith checks.
// FIX #7 — Workspace scan reads files via fs.promises, not openTextDocument.
// FIX #8 — getScanExtensions() drives the glob, honouring the user's settings.
function updateAIStats(document) {
    const { aiLines, total } = countLines(document);
    const percent = total > 0 ? ((aiLines / total) * 100).toFixed(1) : '0.0';
    (0, statusBar_1.updateStatusBar)(percent, total, aiLines);
}
async function updateWorkspaceAIStats() {
    const exts = (0, persistenceService_1.getScanExtensions)().join(',');
    const files = await vscode.workspace.findFiles(`**/*.{${exts}}`, '**/node_modules/**');
    const counts = await Promise.all(files.map(async (file) => {
        try {
            const content = await fs.promises.readFile(file.fsPath, 'utf8');
            return countLinesFromText(content);
        }
        catch {
            return { aiLines: 0, total: 0 };
        }
    }));
    const totalAI = counts.reduce((s, c) => s + c.aiLines, 0);
    const totalAll = counts.reduce((s, c) => s + c.total, 0);
    const percent = totalAll > 0 ? ((totalAI / totalAll) * 100).toFixed(1) : '0.0';
    (0, statusBar_1.updateWorkspaceStatusBar)(percent, totalAll, totalAI);
    return { percent, totalAI, totalAll };
}
// Used for the currently open document (already in memory — no extra I/O)
function countLines(document) {
    return countLinesFromText(document.getText());
}
// Used for files read directly from disk
function countLinesFromText(content) {
    let aiLines = 0;
    let total = 0;
    let inside = false;
    for (const rawLine of content.split('\n')) {
        const text = rawLine.trimStart();
        if (text.startsWith('// >>> AI_START')) {
            inside = true;
            continue;
        }
        if (text.startsWith('// <<< AI_END')) {
            inside = false;
            continue;
        }
        if (rawLine.trim().length > 0) {
            total++;
            if (inside)
                aiLines++;
        }
    }
    return { aiLines, total };
}
//# sourceMappingURL=aiTracker.js.map