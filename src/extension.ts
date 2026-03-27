import * as vscode from 'vscode';

// 🔹 Core Services
import { initEmployee, resetEmployee } from './services/employeeService';
import { ensureHandshake } from './services/handshakeService';

// 🔹 Handlers
import { handleChange } from './handlers/textChangeHandler';

// 🔹 UI
import { initStatusBar } from './ui/statusBar';
import { updateAIStats } from './core/aiTracker';
import { openReportPanel } from './ui/reportPanel';

export async function activate(context: vscode.ExtensionContext) {

    // 🔹 Initialize Employee ID
    await initEmployee(context);

    // 🔹 Ensure Copilot Handshake File
    await ensureHandshake();

    // 🔹 Initialize Status Bar
    initStatusBar();

    // 🔁 TEXT CHANGE LISTENER (Main Detection Engine)
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(handleChange)
    );

    // 📊 AI % TRACKER
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === vscode.window.activeTextEditor?.document) {
                updateAIStats(event.document);
            }
        })
    );

    // 🔄 RESET EMPLOYEE ID COMMAND
    context.subscriptions.push(
        vscode.commands.registerCommand('ai.resetId', async () => {
            await resetEmployee(context);
            vscode.window.showInformationMessage("✅ Employee ID Reset Successfully");
        })
    );

    // 📊 OPEN REPORT (CHROME DASHBOARD)
    context.subscriptions.push(
        vscode.commands.registerCommand('ai.showReport', async () => {
            await openReportPanel();
        })
    );

    // 📌 Initial Run
    if (vscode.window.activeTextEditor) {
        updateAIStats(vscode.window.activeTextEditor.document);
    }
}

export function deactivate() {}