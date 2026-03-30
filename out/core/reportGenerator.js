"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAIBlocks = extractAIBlocks;
exports.extractWorkspaceBlocks = extractWorkspaceBlocks;
const vscode = require("vscode");
function extractAIBlocks(doc) {
    const blocks = [];
    let inside = false;
    let current = null;
    for (let i = 0; i < doc.lineCount; i++) {
        const line = doc.lineAt(i).text;
        if (line.includes("AI_START")) {
            inside = true;
            const emp = line.match(/ID:\s*(\w+)/)?.[1] || "UNKNOWN";
            const date = line.match(/\|\s*(\d{2}-\d{2}-\d{4})/)?.[1] || "";
            const edited = line.match(/EditedBy:\s*(.*)/)?.[1];
            const hash = line.match(/HASH:\s*(\w+)/)?.[1];
            current = {
                employeeId: emp,
                editedBy: edited ? edited.split(",").map(s => s.trim()) : [],
                date,
                file: doc.fileName.split("\\").pop(),
                lines: 0,
                hash
            };
        }
        if (inside && current) {
            current.lines++;
        }
        if (line.includes("AI_END") && inside) {
            inside = false;
            blocks.push(current);
        }
    }
    return blocks;
}
async function extractWorkspaceBlocks() {
    const files = await vscode.workspace.findFiles('**/*.{js,ts,jsx,tsx}');
    let allBlocks = [];
    for (const file of files) {
        const doc = await vscode.workspace.openTextDocument(file);
        const blocks = extractAIBlocks(doc);
        allBlocks = allBlocks.concat(blocks);
    }
    return allBlocks;
}
//# sourceMappingURL=reportGenerator.js.map