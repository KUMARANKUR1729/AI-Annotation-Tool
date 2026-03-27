"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMetadata = generateMetadata;
exports.appendEditor = appendEditor;
function generateMetadata(employeeId) {
    var date = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    return { employeeId: employeeId, date: date };
}
function appendEditor(metadata, employeeId, date) {
    var stamp = "".concat(employeeId, " (").concat(date, ")");
    if (metadata.includes(stamp))
        return metadata;
    if (metadata.includes("EditedBy:")) {
        return "".concat(metadata, ", ").concat(stamp);
    }
    return "".concat(metadata, " | EditedBy: ").concat(stamp);
}
