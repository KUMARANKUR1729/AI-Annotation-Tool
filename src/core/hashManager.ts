import * as crypto from 'crypto';

export function generateHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 6);
}

export function verifyHash(content: string, hash: string): boolean {
    return generateHash(content) === hash;
}