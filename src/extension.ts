import * as vscode from 'vscode';

// Core Services
import { initEmployee, resetEmployee } from './services/employeeService';
import { ensureHandshake } from './services/handshakeService';
import { initPersistence } from './services/persistenceService';

// Handlers
import { handleChange } from './handlers/textChangeHandler';

// UI
import { initStatusBar } from './ui/statusBar';
import { updateAIStats, updateWorkspaceAIStats } from './core/aiTracker';
import { openReportPanel } from './ui/reportPanel';

export async function activate(context: vscode.ExtensionContext) {

    // Initialize persistence first (other services depend on it)
    initPersistence(context);

    // Initialize Employee ID
    await initEmployee(context);

    // Ensure Copilot Handshake File
    await ensureHandshake();

    // Initialize Status Bar
    initStatusBar();

    // TEXT CHANGE LISTENER — Main Detection Engine
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(handleChange)
    );

    // AI % TRACKER — current file
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === vscode.window.activeTextEditor?.document) {
                updateAIStats(event.document);
            }
        })
    );

    // Update workspace stats when switching files
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                updateAIStats(editor.document);
                updateWorkspaceAIStats();
            }
        })
    );

    // RESET EMPLOYEE ID COMMAND
    context.subscriptions.push(
        vscode.commands.registerCommand('ai.resetId', async () => {
            await resetEmployee(context);
            vscode.window.showInformationMessage('Employee ID Reset Successfully');
        })
    );

    // OPEN REPORT DASHBOARD
    context.subscriptions.push(
        vscode.commands.registerCommand('ai.showReport', async () => {
            await openReportPanel();
        })
    );

    // Initial stats run
    if (vscode.window.activeTextEditor) {
        updateAIStats(vscode.window.activeTextEditor.document);
        updateWorkspaceAIStats();
    }
}

export function deactivate() {}
