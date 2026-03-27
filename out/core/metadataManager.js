"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMeta = generateMeta;
exports.updateEditedBy = updateEditedBy;
function generateMeta(emp) {
    const date = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    return { emp, date };
}
function updateEditedBy(existing, emp, date) {
    const stamp = `${emp} (${date})`;
    if (existing.includes(stamp))
        return existing;
    if (existing.includes("EditedBy:")) {
        return `${existing}, ${stamp}`;
    }
    return `${existing} | EditedBy: ${stamp}`;
}
//# sourceMappingURL=metadataManager.js.map