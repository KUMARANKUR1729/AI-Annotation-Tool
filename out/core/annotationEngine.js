"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.annotate = annotate;
const vscode = require("vscode");
const employeeService_1 = require("../services/employeeService");
const metadataManager_1 = require("./metadataManager");
const blockParser_1 = require("./blockParser");
let isProcessing = false;
async function annotate(doc, range, text) {
    if (isProcessing)
        return;
    isProcessing = true;
    try {
        const line = range.start.line;
        const { emp, date } = (0, metadataManager_1.generateMeta)((0, employeeService_1.getEmployeeId)());
        const edit = new vscode.WorkspaceEdit();
        // 🧠 CASE 1: Inside existing block → update EditedBy
        if ((0, blockParser_1.isInsideBlock)(doc, line)) {
            for (let i = line; i >= 0; i--) {
                const t = doc.lineAt(i).text;
                if (t.includes("AI_START")) {
                    const updated = (0, metadataManager_1.updateEditedBy)(t, emp, date);
                    edit.replace(doc.uri, doc.lineAt(i).range, updated);
                    break;
                }
                if (t.includes("AI_END"))
                    break;
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
    }
    catch (e) {
        console.error(e);
    }
    finally {
        setTimeout(() => isProcessing = false, 500);
    }
}
//# sourceMappingURL=annotationEngine.js.map