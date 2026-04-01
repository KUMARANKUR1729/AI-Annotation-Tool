"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initEmployee = initEmployee;
exports.getEmployeeId = getEmployeeId;
exports.resetEmployee = resetEmployee;
const vscode = require("vscode");
let employeeId = "GUEST";
async function initEmployee(context) {
    let saved = context.globalState.get('employeeId');
    if (!saved) {
        saved = await askId();
        await context.globalState.update('employeeId', saved);
    }
    employeeId = saved;
}
function getEmployeeId() {
    return employeeId;
}
async function resetEmployee(context) {
    const newId = await askId();
    employeeId = newId;
    await context.globalState.update('employeeId', newId);
}
// FIX #9 — Strict alphanumeric validation prevents Employee IDs that contain
//           pipe characters (|), spaces, or special chars from corrupting the
//           annotation header format (e.g. "ID: EMP | HASH: abc" would break parsers).
async function askId() {
    return await vscode.window.showInputBox({
        prompt: 'Enter Employee ID (3–20 alphanumeric characters; A–Z, 0–9, _ or - allowed)',
        ignoreFocusOut: true,
        validateInput: t => {
            if (!t || t.trim().length === 0)
                return 'Employee ID is required';
            if (!/^[A-Za-z0-9_-]{3,20}$/.test(t.trim())) {
                return 'ID must be 3–20 characters: letters, digits, underscores, or hyphens only';
            }
            return null;
        },
    }) || 'GUEST';
}
//# sourceMappingURL=employeeService.js.map