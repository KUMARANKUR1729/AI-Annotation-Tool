import * as vscode from 'vscode';
import { getEmployeeId } from '../services/employeeService';
import { generateMeta, updateEditedBy } from './metadataManager';
import { isInsideBlock } from './blockParser';

let isProcessing = false;

export async function annotate(doc: vscode.TextDocument, range: vscode.Range, text: string) {

    if (isProcessing) return;
    isProcessing = true;

    try {
        const line = range.start.line;

        const { emp, date } = generateMeta(getEmployeeId());

        const edit = new vscode.WorkspaceEdit();

        // 🧠 CASE 1: Inside existing block → update EditedBy
        if (isInsideBlock(doc, line)) {

            for (let i = line; i >= 0; i--) {
                const t = doc.lineAt(i).text;

                if (t.includes("AI_START")) {
                    const updated = updateEditedBy(t, emp, date);
                    edit.replace(doc.uri, doc.lineAt(i).range, updated);
                    break;
                }

                if (t.includes("AI_END")) break;
            }

            await vscode.workspace.applyEdit(edit);
            return;
        }

        // 🧠 CASE 2: New block
        const header = `// >>> AI_START | ID: ${emp} | ${date}\n`;
        const footer = `\n// <<< AI_END\n`;

        const lines = text.split("\n").length;

        edit.insert(doc.uri, new vscode.Position(line, 0), header);
        edit.insert(doc.uri, new vscode.Position(line + lines + 1, 0), footer);

        await vscode.workspace.applyEdit(edit);

    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => isProcessing = false, 500);
    }
}