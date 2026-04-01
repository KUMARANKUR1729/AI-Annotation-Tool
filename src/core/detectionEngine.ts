// FIX #1 — Replaced naive ">20 chars = AI" heuristic with structural code-signal detection.
// Requirements: at least 4 non-empty lines, 80+ chars, AND 2+ distinct code-structure patterns.
// This eliminates false positives for long variable names, comments, and manual typing.

const CODE_SIGNALS: RegExp[] = [
    /\b(function|const|let|var|class|interface|type|enum)\b/,
    /\b(import|export|require)\b/,
    /[{}]\s*$/m,
    /=>\s*[\w({]|async\s+\w|\bawait\b/,
    /\b(if|else|for|while|switch|try|catch|return|throw)\b/,
    /^\s*(\/\/|\/\*|\*\s)/m,
];

export function isAI(text: string, clipboard: string): boolean {
    const trimmed = text.trim();

    if (!trimmed) return false;

    // Exact clipboard match = user's own copy-paste, not AI
    if (trimmed === clipboard.trim()) return false;

    const nonEmptyLines = trimmed.split('\n').filter(l => l.trim().length > 0);

    // Must have at least 4 substantive lines — short edits are never AI blocks
    if (nonEmptyLines.length < 4) return false;

    // Must have substantial character content
    if (trimmed.length < 80) return false;

    // Must match at least 2 distinct structural code patterns
    const signalCount = CODE_SIGNALS.filter(p => p.test(trimmed)).length;
    return signalCount >= 2;
}
