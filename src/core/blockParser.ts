import * as vscode from 'vscode';

// FIX #4  — All marker checks now use trimStart().startsWith() anchored to the beginning
//           of the line, not loose includes(). This prevents a variable name, string
//           literal, or log statement containing "AI_START" from corrupting the parser state.
//
// FIX #10 — Orphaned AI_END (no matching AI_START) is now handled gracefully:
//           if AI_END is encountered while not inside a block, it is silently ignored
//           rather than permanently corrupting the 'inside' state.

export function isInsideBlock(doc: vscode.TextDocument, line: number): boolean {
    let inside = false;

    for (let i = 0; i <= line; i++) {
        const t = doc.lineAt(i).text.trimStart();

        if (t.startsWith('// >>> AI_START')) {
            inside = true;
            continue;
        }

        if (t.startsWith('// <<< AI_END')) {
            if (!inside) {
                // Orphaned AI_END — log a warning but do not corrupt state
                console.warn(`[AI Annotator] Orphaned AI_END at line ${i} — no matching AI_START`);
            }
            inside = false;
        }
    }

    return inside;
}
