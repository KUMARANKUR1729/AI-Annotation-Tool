import * as vscode from 'vscode';
import { AIBlock, Snapshot } from '../core/types';

// FIX — Circular dependency broken: AIBlock and Snapshot now live in core/types.ts,
//       imported here directly instead of from reportGenerator.

// Re-export Snapshot so any existing consumers don't need import changes.
export { Snapshot } from '../core/types';

let _context: vscode.ExtensionContext;

export function initPersistence(context: vscode.ExtensionContext) {
    _context = context;
}

// FIX #11 — Snapshot no longer overwrites blindly on every dashboard open.
//           A new snapshot is only written if at least 1 hour has passed since
//           the last save for today, preserving earlier data points in the day.
export function saveSnapshot(blocks: AIBlock[], totalLines: number, aiLines: number) {
    const snapshots = getSnapshots();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const aiPercent = totalLines > 0
        ? parseFloat(((aiLines / totalLines) * 100).toFixed(1))
        : 0;

    const snap: Snapshot = {
        timestamp: now.toISOString(),
        date: today,
        blocks,
        totalLines,
        aiLines,
        aiPercent,
    };

    const existingIdx = snapshots.findIndex(s => s.date === today);

    if (existingIdx >= 0) {
        const lastSaved = new Date(snapshots[existingIdx].timestamp);
        const hoursSince = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60);

        // Only overwrite if at least 1 hour has elapsed — keeps earlier data intact
        if (hoursSince < 1) return;

        snapshots[existingIdx] = snap;
    } else {
        snapshots.push(snap);
    }

    // Rolling 90-day window
    if (snapshots.length > 90) {
        snapshots.splice(0, snapshots.length - 90);
    }

    _context.globalState.update('ai_snapshots', snapshots);
}

export function getSnapshots(): Snapshot[] {
    return _context.globalState.get<Snapshot[]>('ai_snapshots') || [];
}

export function getTeamConfig(): Record<string, string> {
    return _context.globalState.get<Record<string, string>>('ai_team_config') || {};
}

export function saveTeamConfig(config: Record<string, string>) {
    _context.globalState.update('ai_team_config', config);
}

export function getRiskThreshold(): number {
    return _context.globalState.get<number>('ai_risk_threshold') ?? 60;
}

export function saveRiskThreshold(threshold: number) {
    _context.globalState.update('ai_risk_threshold', threshold);
}

export function getScanExtensions(): string[] {
    return _context.globalState.get<string[]>('ai_scan_extensions') || ['js', 'ts', 'jsx', 'tsx'];
}

export function saveScanExtensions(exts: string[]) {
    _context.globalState.update('ai_scan_extensions', exts);
}
