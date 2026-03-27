"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAIBlocks = extractAIBlocks;
function extractAIBlocks(doc) {
    const blocks = [];
    let inside = false;
    let startLine = 0;
    let currentMeta = null;
    for (let i = 0; i < doc.lineCount; i++) {
        const line = doc.lineAt(i).text;
        if (line.includes("AI_START")) {
            inside = true;
            startLine = i;
            const emp = line.match(/ID:\s*(\w+)/)?.[1] || "UNKNOWN";
            const date = line.match(/\|\s*(\d{2}-\d{2}-\d{4})/)?.[1] || "";
            const edited = line.match(/EditedBy:\s*(.*)/)?.[1];
            currentMeta = {
                employeeId: emp,
                editedBy: edited ? edited.split(",").map(s => s.trim()) : [],
                date,
                file: doc.fileName,
                lines: 0
            };
        }
        if (inside) {
            currentMeta.lines++;
        }
        if (line.includes("AI_END") && inside) {
            inside = false;
            blocks.push(currentMeta);
        }
    }
    return blocks;
}
//# sourceMappingURL=reportGenerator.js.map