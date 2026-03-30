import * as vscode from 'vscode';
import { updateStatusBar, updateWorkspaceStatusBar } from '../ui/statusBar';

export function updateAIStats(document: vscode.TextDocument) {
    const { aiLines, total } = countLines(document);
    const percent = total > 0 ? ((aiLines / total) * 100).toFixed(1) : '0.0';
    updateStatusBar(percent, total, aiLines);
}

export async function updateWorkspaceAIStats(): Promise<{ percent: string; totalAI: number; totalAll: number }> {
    const files = await vscode.workspace.findFiles('**/*.{js,ts,jsx,tsx}', '**/node_modules/**');
    let totalAI = 0;
    let totalAll = 0;

    for (const file of files) {
        try {
            const doc = await vscode.workspace.openTextDocument(file);
            const { aiLines, total } = countLines(doc);
            totalAI += aiLines;
            totalAll += total;
        } catch { /* skip unreadable files */ }
    }

    const percent = totalAll > 0 ? ((totalAI / totalAll) * 100).toFixed(1) : '0.0';
    updateWorkspaceStatusBar(percent, totalAll, totalAI);
    return { percent, totalAI, totalAll };
}

export function countLines(document: vscode.TextDocument): { aiLines: number; total: number } {
    let aiLines = 0;
    let total = 0;
    let inside = false;

    for (let i = 0; i < document.lineCount; i++) {
        const text = document.lineAt(i).text.trim();
        if (text.includes('AI_START')) { inside = true; continue; }
        if (text.includes('AI_END'))   { inside = false; continue; }
        if (text.length > 0) {
            total++;
            if (inside) { aiLines++; }
        }
    }
    return { aiLines, total };
}
