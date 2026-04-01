import * as vscode from 'vscode';

let employeeId = "GUEST";

export async function initEmployee(context: vscode.ExtensionContext) {
    let saved = context.globalState.get<string>('employeeId');

    if (!saved) {
        saved = await askId();
        await context.globalState.update('employeeId', saved);
    }

    employeeId = saved;
}

export function getEmployeeId() {
    return employeeId;
}

export async function resetEmployee(context: vscode.ExtensionContext) {
    const newId = await askId();
    employeeId = newId;
    await context.globalState.update('employeeId', newId);
}

// FIX #9 — Strict alphanumeric validation prevents Employee IDs that contain
//           pipe characters (|), spaces, or special chars from corrupting the
//           annotation header format (e.g. "ID: EMP | HASH: abc" would break parsers).
async function askId(): Promise<string> {
    return await vscode.window.showInputBox({
        prompt: 'Enter Employee ID (3–20 alphanumeric characters; A–Z, 0–9, _ or - allowed)',
        ignoreFocusOut: true,
        validateInput: t => {
            if (!t || t.trim().length === 0) return 'Employee ID is required';
            if (!/^[A-Za-z0-9_-]{3,20}$/.test(t.trim())) {
                return 'ID must be 3–20 characters: letters, digits, underscores, or hyphens only';
            }
            return null;
        },
    }) || 'GUEST';
}