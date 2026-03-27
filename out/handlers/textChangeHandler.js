"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChange = handleChange;
const vscode = require("vscode");
const detectionEngine_1 = require("../core/detectionEngine");
const annotationEngine_1 = require("../core/annotationEngine");
let timer;
async function handleChange(e) {
    const doc = e.document;
    if (e.reason === vscode.TextDocumentChangeReason.Undo ||
        e.reason === vscode.TextDocumentChangeReason.Redo)
        return;
    const clipboard = await vscode.env.clipboard.readText();
    for (const change of e.contentChanges) {
        const text = change.text;
        if (text.includes("AI_START") || text.includes("AI_END"))
            return;
        if (!(0, detectionEngine_1.isAI)(text, clipboard))
            continue;
        clearTimeout(timer);
        timer = setTimeout(() => {
            (0, annotationEngine_1.annotate)(doc, change.range, text);
        }, 1000);
        break;
    }
}
//# sourceMappingURL=textChangeHandler.js.map