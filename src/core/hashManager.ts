import * as crypto from 'crypto';

// FIX #12 — Replaced MD5 (cryptographically broken, trivial collisions) with SHA-256.
//           Increased digest length from 6 to 8 hex chars (32 bits) for meaningful
//           collision resistance while keeping the annotation header compact.

export function generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
}

export function verifyHash(content: string, hash: string): boolean {
    return generateHash(content) === hash;
}