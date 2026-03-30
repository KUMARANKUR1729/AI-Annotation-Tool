"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initStatusBar = initStatusBar;
exports.updateStatusBar = updateStatusBar;
exports.updateWorkspaceStatusBar = updateWorkspaceStatusBar;
const vscode = require("vscode");
let fileBar;
let workspaceBar;
function initStatusBar() {
    fileBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
    fileBar.command = 'ai.showReport';
    workspaceBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    workspaceBar.command = 'ai.showReport';
}
function updateStatusBar(percent, total, ai) {
    const p = parseFloat(percent);
    fileBar.text = `$(circuit-board) File: ${percent}%`;
    fileBar.backgroundColor = getRiskColor(p);
    fileBar.tooltip = `Current file — ${ai} AI lines / ${total} total  |  Click to open dashboard`;
    fileBar.show();
}
function updateWorkspaceStatusBar(percent, total, ai) {
    const p = parseFloat(percent);
    workspaceBar.text = `$(globe) WS: ${percent}%`;
    workspaceBar.backgroundColor = getRiskColor(p);
    workspaceBar.tooltip = `Workspace — ${ai} AI lines / ${total} total  |  Click to open dashboard`;
    workspaceBar.show();
}
function getRiskColor(p) {
    if (p > 60) {
        return new vscode.ThemeColor('statusBarItem.errorBackground');
    }
    if (p > 30) {
        return new vscode.ThemeColor('statusBarItem.warningBackground');
    }
    return undefined;
}
//# sourceMappingURL=statusBar.js.map