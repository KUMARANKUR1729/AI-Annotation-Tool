"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChange = handleChange;
const vscode = require("vscode");
const detectionEngine_1 = require("../core/detectionEngine");
const annotationEngine_1 = require("../core/annotationEngine");
// FIX #3 — Per-document debounce timers replace the single global timer.
// Prevents the previous file's debounce from cancelling a paste in a different file,
// and eliminates the risk of annotating the wrong document.
const timerMap = new Map();
async function handleChange(e) {
    const doc = e.document;
    const key = doc.uri.toString();
    if (e.reason === vscode.TextDocumentChangeReason.Undo ||
        e.reason === vscode.TextDocumentChangeReason.Redo)
        return;
    const clipboard = await vscode.env.clipboard.readText();
    for (const change of e.contentChanges) {
        const text = change.text;
        // Skip annotation markers themselves to avoid re-entry
        if (text.includes('AI_START') || text.includes('AI_END'))
            return;
        if (!(0, detectionEngine_1.isAI)(text, clipboard))
            continue;
        // Clear only the timer for THIS document
        const existing = timerMap.get(key);
        if (existing)
            clearTimeout(existing);
        timerMap.set(key, setTimeout(() => {
            timerMap.delete(key);
            (0, annotationEngine_1.annotate)(doc, change.range, text);
        }, 1000));
        break;
    }
}
//# sourceMappingURL=textChangeHandler.js.map