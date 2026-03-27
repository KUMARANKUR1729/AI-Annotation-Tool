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

async function askId(): Promise<string> {
    return await vscode.window.showInputBox({
        prompt: "Enter Employee ID",
        ignoreFocusOut: true,
        validateInput: t => t.length > 0 ? null : "Required"
    }) || "GUEST";
}