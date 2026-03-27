"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initStatusBar = initStatusBar;
exports.updateStatusBar = updateStatusBar;
exports.getStatusBar = getStatusBar;
var vscode = require("vscode");
var statusBar;
function initStatusBar() {
    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
}
function updateStatusBar(percentage, total, ai) {
    statusBar.text = "$(circuit-board) AI: ".concat(percentage, "%");
    statusBar.tooltip = "Total: ".concat(total, " | AI: ").concat(ai);
    statusBar.show();
}
function getStatusBar() {
    return statusBar;
}
