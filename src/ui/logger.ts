import * as vscode from 'vscode';

let logger: vscode.OutputChannel;

export function initLogger() {
    logger = vscode.window.createOutputChannel("AI Annotator");
    logger.show(true);
}

export function logInfo(message: string) {
    logger?.appendLine(`[INFO] ${message}`);
}

export function logError(message: string) {
    logger?.appendLine(`[ERROR] ${message}`);
}