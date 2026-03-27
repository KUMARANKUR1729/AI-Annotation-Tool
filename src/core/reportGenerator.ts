import * as vscode from 'vscode';

export interface AIBlock {
    employeeId: string;
    editedBy: string[];
    date: string;
    file: string;
    lines: number;
}

// 🔥 NEW: Scan single document
export function extractAIBlocks(doc: vscode.TextDocument): AIBlock[] {
    const blocks: AIBlock[] = [];

    let inside = false;
    let current: any = null;

    for (let i = 0; i < doc.lineCount; i++) {
        const line = doc.lineAt(i).text;

        if (line.includes("AI_START")) {
            inside = true;

            const emp = line.match(/ID:\s*(\w+)/)?.[1] || "UNKNOWN";
            const date = line.match(/\|\s*(\d{2}-\d{2}-\d{4})/)?.[1] || "";
            const edited = line.match(/EditedBy:\s*(.*)/)?.[1];

            current = {
                employeeId: emp,
                editedBy: edited ? edited.split(",").map(s => s.trim()) : [],
                date,
                file: doc.fileName.split("\\").pop(),
                lines: 0
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

// 🔥 NEW: Scan ENTIRE WORKSPACE
export async function extractWorkspaceBlocks(): Promise<AIBlock[]> {
    const files = await vscode.workspace.findFiles('**/*.{js,ts,jsx,tsx}');
    let allBlocks: AIBlock[] = [];

    for (const file of files) {
        const doc = await vscode.workspace.openTextDocument(file);
        const blocks = extractAIBlocks(doc);
        allBlocks = allBlocks.concat(blocks);
    }

    return allBlocks;
}