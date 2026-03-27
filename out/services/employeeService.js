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
async function askId() {
    return await vscode.window.showInputBox({
        prompt: "Enter Employee ID",
        ignoreFocusOut: true,
        validateInput: t => t.length > 0 ? null : "Required"
    }) || "GUEST";
}
//# sourceMappingURL=employeeService.js.map