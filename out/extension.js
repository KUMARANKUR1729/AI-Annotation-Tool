"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
// Core Services
const employeeService_1 = require("./services/employeeService");
const handshakeService_1 = require("./services/handshakeService");
const persistenceService_1 = require("./services/persistenceService");
// Handlers
const textChangeHandler_1 = require("./handlers/textChangeHandler");
// UI
const statusBar_1 = require("./ui/statusBar");
const aiTracker_1 = require("./core/aiTracker");
const reportPanel_1 = require("./ui/reportPanel");
async function activate(context) {
    // Initialize persistence first (other services depend on it)
    (0, persistenceService_1.initPersistence)(context);
    // Initialize Employee ID
    await (0, employeeService_1.initEmployee)(context);
    // Ensure Copilot Handshake File
    await (0, handshakeService_1.ensureHandshake)();
    // Initialize Status Bar
    (0, statusBar_1.initStatusBar)();
    // TEXT CHANGE LISTENER — Main Detection Engine
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(textChangeHandler_1.handleChange));
    // AI % TRACKER — current file
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document === vscode.window.activeTextEditor?.document) {
            (0, aiTracker_1.updateAIStats)(event.document);
        }
    }));
    // Update workspace stats when switching files
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            (0, aiTracker_1.updateAIStats)(editor.document);
            (0, aiTracker_1.updateWorkspaceAIStats)();
        }
    }));
    // RESET EMPLOYEE ID COMMAND
    context.subscriptions.push(vscode.commands.registerCommand('ai.resetId', async () => {
        await (0, employeeService_1.resetEmployee)(context);
        vscode.window.showInformationMessage('Employee ID Reset Successfully');
    }));
    // OPEN REPORT DASHBOARD
    context.subscriptions.push(vscode.commands.registerCommand('ai.showReport', async () => {
        await (0, reportPanel_1.openReportPanel)();
    }));
    // Initial stats run
    if (vscode.window.activeTextEditor) {
        (0, aiTracker_1.updateAIStats)(vscode.window.activeTextEditor.document);
        (0, aiTracker_1.updateWorkspaceAIStats)();
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map