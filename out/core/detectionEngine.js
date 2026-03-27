"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAI = isAI;
function isAI(text, clipboard) {
    if (!text.trim())
        return false;
    if (text.trim() === clipboard.trim())
        return false;
    if (text.length > 20)
        return true;
    if (text.split("\n").length > 3)
        return true;
    return false;
}
//# sourceMappingURL=detectionEngine.js.map