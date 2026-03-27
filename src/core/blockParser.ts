import * as vscode from 'vscode';

export function isInsideBlock(doc: vscode.TextDocument, line: number): boolean {
    let inside = false;

    for (let i = 0; i <= line; i++) {
        const t = doc.lineAt(i).text;

        if (t.includes("AI_START")) inside = true;
        if (t.includes("AI_END")) inside = false;
    }

    return inside;
}