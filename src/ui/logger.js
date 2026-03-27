"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLogger = initLogger;
exports.logInfo = logInfo;
exports.logError = logError;
var vscode = require("vscode");
var logger;
function initLogger() {
    logger = vscode.window.createOutputChannel("AI Annotator");
    logger.show(true);
}
function logInfo(message) {
    logger === null || logger === void 0 ? void 0 : logger.appendLine("[INFO] ".concat(message));
}
function logError(message) {
    logger === null || logger === void 0 ? void 0 : logger.appendLine("[ERROR] ".concat(message));
}
