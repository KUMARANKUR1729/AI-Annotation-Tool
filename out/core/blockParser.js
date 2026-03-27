"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInsideBlock = isInsideBlock;
function isInsideBlock(doc, line) {
    let inside = false;
    for (let i = 0; i <= line; i++) {
        const t = doc.lineAt(i).text;
        if (t.includes("AI_START"))
            inside = true;
        if (t.includes("AI_END"))
            inside = false;
    }
    return inside;
}
//# sourceMappingURL=blockParser.js.map