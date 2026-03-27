"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initStatusBar = initStatusBar;
exports.updateStatusBar = updateStatusBar;
const vscode = require("vscode");
let bar;
function initStatusBar() {
    bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
}
function updateStatusBar(percent, total, ai) {
    bar.text = `$(circuit-board) AI: ${percent}%`;
    bar.tooltip = `Total: ${total} | AI: ${ai}`;
    bar.show();
}
//# sourceMappingURL=statusBar.js.map