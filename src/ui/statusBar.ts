import * as vscode from 'vscode';

let bar: vscode.StatusBarItem;

export function initStatusBar() {
    bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
}

export function updateStatusBar(percent: string, total: number, ai: number) {
    bar.text = `$(circuit-board) AI: ${percent}%`;
    bar.tooltip = `Total: ${total} | AI: ${ai}`;
    bar.show();
}