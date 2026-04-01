import * as vscode from 'vscode';
import { isAI } from '../core/detectionEngine';
import { annotate } from '../core/annotationEngine';

// FIX #3 — Per-document debounce timers replace the single global timer.
// Prevents the previous file's debounce from cancelling a paste in a different file,
// and eliminates the risk of annotating the wrong document.
const timerMap = new Map<string, NodeJS.Timeout>();

export async function handleChange(e: vscode.TextDocumentChangeEvent) {
    const doc = e.document;
    const key = doc.uri.toString();

    if (
        e.reason === vscode.TextDocumentChangeReason.Undo ||
        e.reason === vscode.TextDocumentChangeReason.Redo
    ) return;

    const clipboard = await vscode.env.clipboard.readText();

    for (const change of e.contentChanges) {
        const text = change.text;

        // Skip annotation markers themselves to avoid re-entry
        if (text.includes('AI_START') || text.includes('AI_END')) return;

        if (!isAI(text, clipboard)) continue;

        // Clear only the timer for THIS document
        const existing = timerMap.get(key);
        if (existing) clearTimeout(existing);

        timerMap.set(
            key,
            setTimeout(() => {
                timerMap.delete(key);
                annotate(doc, change.range, text);
            }, 1000)
        );

        break;
    }
}
