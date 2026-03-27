import * as vscode from 'vscode';
import { isAI } from '../core/detectionEngine';
import { annotate } from '../core/annotationEngine';

let timer: NodeJS.Timeout;

export async function handleChange(e: vscode.TextDocumentChangeEvent) {
    const doc = e.document;

    if (e.reason === vscode.TextDocumentChangeReason.Undo ||
        e.reason === vscode.TextDocumentChangeReason.Redo) return;

    const clipboard = await vscode.env.clipboard.readText();

    for (const change of e.contentChanges) {
        const text = change.text;

        if (text.includes("AI_START") || text.includes("AI_END")) return;

        if (!isAI(text, clipboard)) continue;

        clearTimeout(timer);

        timer = setTimeout(() => {
            annotate(doc, change.range, text);
        }, 1000);

        break;
    }
}