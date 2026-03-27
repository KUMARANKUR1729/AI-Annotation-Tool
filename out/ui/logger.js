"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLogger = initLogger;
exports.logInfo = logInfo;
exports.logError = logError;
const vscode = require("vscode");
let logger;
function initLogger() {
    logger = vscode.window.createOutputChannel("AI Annotator");
    logger.show(true);
}
function logInfo(message) {
    logger?.appendLine(`[INFO] ${message}`);
}
function logError(message) {
    logger?.appendLine(`[ERROR] ${message}`);
}
//# sourceMappingURL=logger.js.map