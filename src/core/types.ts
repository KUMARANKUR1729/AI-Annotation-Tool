// Shared domain types — imported by both reportGenerator and persistenceService
// to avoid circular dependency.

export interface AIBlock {
    employeeId: string;
    editedBy: string[];
    date: string;
    file: string;
    lines: number;
    hash?: string;
}

export interface Snapshot {
    timestamp: string;
    date: string;
    blocks: AIBlock[];
    totalLines: number;
    aiLines: number;
    aiPercent: number;
}
