import * as vscode from 'vscode';
import { getEmployeeId } from '../services/employeeService';
import { generateMeta, updateEditedBy } from './metadataManager';
import { isInsideBlock } from './blockParser';
import { generateHash } from './hashManager';

// FIX #2 — Per-document processing lock replaces the single global boolean.
// Prevents silently dropping annotations when two documents are edited concurrently.
const processingMap = new Map<string, boolean>();

export async function annotate(doc: vscode.TextDocument, range: vscode.Range, text: string) {
    const key = doc.uri.toString();

    if (processingMap.get(key)) return;
    processingMap.set(key, true);

    try {
        const line = range.start.line;
        const { emp, date } = generateMeta(getEmployeeId());
        const edit = new vscode.WorkspaceEdit();

        // CASE 1: Inside an existing block — update EditedBy only
        if (isInsideBlock(doc, line)) {
            for (let i = line; i >= 0; i--) {
                const t = doc.lineAt(i).text;

                // FIX #4 (partial) — anchored check, not loose includes()
                if (t.trimStart().startsWith('// >>> AI_START')) {
                    const updated = updateEditedBy(t, emp, date);
                    edit.replace(doc.uri, doc.lineAt(i).range, updated);
                    break;
                }

                if (t.trimStart().startsWith('// <<< AI_END')) break;
            }

            await vscode.workspace.applyEdit(edit);
            return;
        }

        // CASE 2: New block — wrap with header + footer

        // FIX #6 — Hash is now generated from the actual pasted content and embedded in the header.
        const hash = generateHash(text);

        const header = `// >>> AI_START | ID: ${emp} | ${date} | HASH: ${hash}\n`;
        const footer = `\n// <<< AI_END\n`;

        // FIX #5 — Off-by-one corrected.
        // trimEnd() removes trailing newlines so trailing empty lines don't inflate the count.
        // Footer goes at (line + lineCount), not (line + lines + 1).
        const lineCount = text.trimEnd() === '' ? 1 : text.trimEnd().split('\n').length;

        edit.insert(doc.uri, new vscode.Position(line, 0), header);
        edit.insert(doc.uri, new vscode.Position(line + lineCount, 0), footer);

        await vscode.workspace.applyEdit(edit);

    } catch (e) {
        console.error('[AI Annotator] annotate error:', e);
    } finally {
        // Release per-document lock after a short guard window
        setTimeout(() => processingMap.delete(key), 500);
    }
}
