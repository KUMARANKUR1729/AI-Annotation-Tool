import * as vscode from 'vscode';
import { AIBlock } from '../core/reportGenerator';

export interface Snapshot {
    timestamp: string;
    date: string;
    blocks: AIBlock[];
    totalLines: number;
    aiLines: number;
    aiPercent: number;
}

let _context: vscode.ExtensionContext;

export function initPersistence(context: vscode.ExtensionContext) {
    _context = context;
}

export function saveSnapshot(blocks: AIBlock[], totalLines: number, aiLines: number) {
    const snapshots = getSnapshots();
    const today = new Date().toISOString().split('T')[0];
    const aiPercent = totalLines > 0 ? parseFloat(((aiLines / totalLines) * 100).toFixed(1)) : 0;

    const snap: Snapshot = {
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
    } else {
        snapshots.push(snap);
    }

    // Keep last 90 days
    if (snapshots.length > 90) { snapshots.splice(0, snapshots.length - 90); }
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
