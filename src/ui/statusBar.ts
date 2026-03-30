import * as vscode from 'vscode';

let fileBar: vscode.StatusBarItem;
let workspaceBar: vscode.StatusBarItem;

export function initStatusBar() {
    fileBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
    fileBar.command = 'ai.showReport';

    workspaceBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    workspaceBar.command = 'ai.showReport';
}

export function updateStatusBar(percent: string, total: number, ai: number) {
    const p = parseFloat(percent);
    fileBar.text = `$(circuit-board) File: ${percent}%`;
    fileBar.backgroundColor = getRiskColor(p);
    fileBar.tooltip = `Current file — ${ai} AI lines / ${total} total  |  Click to open dashboard`;
    fileBar.show();
}

export function updateWorkspaceStatusBar(percent: string, total: number, ai: number) {
    const p = parseFloat(percent);
    workspaceBar.text = `$(globe) WS: ${percent}%`;
    workspaceBar.backgroundColor = getRiskColor(p);
    workspaceBar.tooltip = `Workspace — ${ai} AI lines / ${total} total  |  Click to open dashboard`;
    workspaceBar.show();
}

function getRiskColor(p: number): vscode.ThemeColor | undefined {
    if (p > 60) { return new vscode.ThemeColor('statusBarItem.errorBackground'); }
    if (p > 30) { return new vscode.ThemeColor('statusBarItem.warningBackground'); }
    return undefined;
}
