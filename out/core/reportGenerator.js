"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAIBlocks = extractAIBlocks;
exports.extractWorkspaceBlocks = extractWorkspaceBlocks;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const persistenceService_1 = require("../services/persistenceService");
// FIX #4  — All marker detection uses startsWith() on trimmed lines, not loose includes().
// FIX #7  — Workspace scan uses fs.promises.readFile instead of openTextDocument,
//           so no VS Code document buffers are created for every file in the repo.
//           Files are processed in parallel batches (Promise.all), not sequentially.
// FIX #8  — getScanExtensions() is called dynamically so the user's Settings choice is honoured.
// FIX #10 — Orphaned AI_START blocks (no matching AI_END) are discarded rather than pushed.
function extractBlocksFromText(content, filePath) {
    const blocks = [];
    const lines = content.split('\n');
    let inside = false;
    let current = null;
    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const trimmed = raw.trimStart();
        if (trimmed.startsWith('// >>> AI_START')) {
            inside = true;
            const emp = raw.match(/ID:\s*([A-Za-z0-9_-]+)/)?.[1] || 'UNKNOWN';
            const date = raw.match(/\|\s*(\d{2}-\d{2}-\d{4})/)?.[1] || '';
            const editedMatch = raw.match(/EditedBy:\s*(.*?)(?:\s*\|[^|]*$|$)/)?.[1];
            const hash = raw.match(/HASH:\s*([a-f0-9]{6,})/)?.[1];
            current = {
                employeeId: emp,
                editedBy: editedMatch
                    ? editedMatch.split(',').map(s => s.trim()).filter(Boolean)
                    : [],
                date,
                file: path.basename(filePath),
                lines: 0,
                hash,
            };
            continue;
        }
        if (trimmed.startsWith('// <<< AI_END')) {
            if (inside && current) {
                blocks.push(current);
            }
            else if (!inside) {
                // FIX #10 — Orphaned AI_END: warn but don't corrupt state
                console.warn(`[AI Annotator] Orphaned AI_END in ${filePath} at line ${i}`);
            }
            inside = false;
            current = null;
            continue;
        }
        if (inside && current && raw.trim().length > 0) {
            current.lines++;
        }
    }
    // FIX #10 — Orphaned AI_START (block never closed): discard silently
    if (inside && current) {
        console.warn(`[AI Annotator] Unclosed AI_START block in ${filePath}`);
    }
    return blocks;
}
// Kept for use when the document is already open in the editor (zero extra I/O cost)
function extractAIBlocks(doc) {
    return extractBlocksFromText(doc.getText(), doc.fileName);
}
async function extractWorkspaceBlocks() {
    // FIX #8 — Use the user-configured extensions, not a hardcoded set
    const exts = (0, persistenceService_1.getScanExtensions)().join(',');
    const files = await vscode.workspace.findFiles(`**/*.{${exts}}`, '**/node_modules/**');
    // FIX #7 — Read all files in parallel using fs, not openTextDocument
    const results = await Promise.all(files.map(async (file) => {
        try {
            const content = await fs.promises.readFile(file.fsPath, 'utf8');
            return extractBlocksFromText(content, file.fsPath);
        }
        catch {
            return [];
        }
    }));
    return results.flat();
}
//# sourceMappingURL=reportGenerator.js.map