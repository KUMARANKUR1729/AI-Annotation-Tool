"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.annotate = annotate;
const vscode = require("vscode");
const employeeService_1 = require("../services/employeeService");
const metadataManager_1 = require("./metadataManager");
const blockParser_1 = require("./blockParser");
const hashManager_1 = require("./hashManager");
// FIX #2 — Per-document processing lock replaces the single global boolean.
// Prevents silently dropping annotations when two documents are edited concurrently.
const processingMap = new Map();
async function annotate(doc, range, text) {
    const key = doc.uri.toString();
    if (processingMap.get(key))
        return;
    processingMap.set(key, true);
    try {
        const line = range.start.line;
        const { emp, date } = (0, metadataManager_1.generateMeta)((0, employeeService_1.getEmployeeId)());
        const edit = new vscode.WorkspaceEdit();
        // CASE 1: Inside an existing block — update EditedBy only
        if ((0, blockParser_1.isInsideBlock)(doc, line)) {
            for (let i = line; i >= 0; i--) {
                const t = doc.lineAt(i).text;
                // FIX #4 (partial) — anchored check, not loose includes()
                if (t.trimStart().startsWith('// >>> AI_START')) {
                    const updated = (0, metadataManager_1.updateEditedBy)(t, emp, date);
                    edit.replace(doc.uri, doc.lineAt(i).range, updated);
                    break;
                }
                if (t.trimStart().startsWith('// <<< AI_END'))
                    break;
            }
            await vscode.workspace.applyEdit(edit);
            return;
        }
        // CASE 2: New block — wrap with header + footer
        // FIX #6 — Hash is now generated from the actual pasted content and embedded in the header.
        const hash = (0, hashManager_1.generateHash)(text);
        const header = `// >>> AI_START | ID: ${emp} | ${date} | HASH: ${hash}\n`;
        const footer = `\n// <<< AI_END\n`;
        // FIX #5 — Off-by-one corrected.
        // trimEnd() removes trailing newlines so trailing empty lines don't inflate the count.
        // Footer goes at (line + lineCount), not (line + lines + 1).
        const lineCount = text.trimEnd() === '' ? 1 : text.trimEnd().split('\n').length;
        edit.insert(doc.uri, new vscode.Position(line, 0), header);
        edit.insert(doc.uri, new vscode.Position(line + lineCount, 0), footer);
        await vscode.workspace.applyEdit(edit);
    }
    catch (e) {
        console.error('[AI Annotator] annotate error:', e);
    }
    finally {
        // Release per-document lock after a short guard window
        setTimeout(() => processingMap.delete(key), 500);
    }
}
//# sourceMappingURL=annotationEngine.js.map