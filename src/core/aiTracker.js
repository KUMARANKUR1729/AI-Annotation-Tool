"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAIStats = updateAIStats;
var statusBar_1 = require("../ui/statusBar");
function updateAIStats(document) {
    var aiLines = 0;
    var total = 0;
    var inside = false;
    for (var i = 0; i < document.lineCount; i++) {
        var text = document.lineAt(i).text.trim();
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
    var percent = total > 0 ? ((aiLines / total) * 100).toFixed(1) : "0.0";
    (0, statusBar_1.updateStatusBar)(percent, total, aiLines);
}
