"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAIStats = updateAIStats;
const statusBar_1 = require("../ui/statusBar");
function updateAIStats(document) {
    let aiLines = 0;
    let total = 0;
    let inside = false;
    for (let i = 0; i < document.lineCount; i++) {
        const text = document.lineAt(i).text.trim();
        if (text.includes("AI_START")) {
            inside = true;
            continue;
        }
        if (text.includes("AI_END")) {
            inside = false;
            continue;
        }
        if (text.length > 0) {
            total++;
            if (inside)
                aiLines++;
        }
    }
    const percent = total > 0 ? ((aiLines / total) * 100).toFixed(1) : "0.0";
    (0, statusBar_1.updateStatusBar)(percent, total, aiLines);
}
//# sourceMappingURL=aiTracker.js.map