"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPersistence = initPersistence;
exports.saveSnapshot = saveSnapshot;
exports.getSnapshots = getSnapshots;
exports.getTeamConfig = getTeamConfig;
exports.saveTeamConfig = saveTeamConfig;
exports.getRiskThreshold = getRiskThreshold;
exports.saveRiskThreshold = saveRiskThreshold;
exports.getScanExtensions = getScanExtensions;
exports.saveScanExtensions = saveScanExtensions;
let _context;
function initPersistence(context) {
    _context = context;
}
function saveSnapshot(blocks, totalLines, aiLines) {
    const snapshots = getSnapshots();
    const today = new Date().toISOString().split('T')[0];
    const aiPercent = totalLines > 0 ? parseFloat(((aiLines / totalLines) * 100).toFixed(1)) : 0;
    const snap = {
        timestamp: new Date().toISOString(),
        date: today,
        blocks,
        totalLines,
        aiLines,
        aiPercent
    };
    const existing = snapshots.findIndex(s => s.date === today);
    if (existing >= 0) {
        snapshots[existing] = snap;
    }
    else {
        snapshots.push(snap);
    }
    // Keep last 90 days
    if (snapshots.length > 90) {
        snapshots.splice(0, snapshots.length - 90);
    }
    _context.globalState.update('ai_snapshots', snapshots);
}
function getSnapshots() {
    return _context.globalState.get('ai_snapshots') || [];
}
function getTeamConfig() {
    return _context.globalState.get('ai_team_config') || {};
}
function saveTeamConfig(config) {
    _context.globalState.update('ai_team_config', config);
}
function getRiskThreshold() {
    return _context.globalState.get('ai_risk_threshold') ?? 60;
}
function saveRiskThreshold(threshold) {
    _context.globalState.update('ai_risk_threshold', threshold);
}
function getScanExtensions() {
    return _context.globalState.get('ai_scan_extensions') || ['js', 'ts', 'jsx', 'tsx'];
}
function saveScanExtensions(exts) {
    _context.globalState.update('ai_scan_extensions', exts);
}
//# sourceMappingURL=persistenceService.js.map