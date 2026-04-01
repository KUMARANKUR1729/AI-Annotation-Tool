"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHash = generateHash;
exports.verifyHash = verifyHash;
const crypto = require("crypto");
// FIX #12 — Replaced MD5 (cryptographically broken, trivial collisions) with SHA-256.
//           Increased digest length from 6 to 8 hex chars (32 bits) for meaningful
//           collision resistance while keeping the annotation header compact.
function generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
}
function verifyHash(content, hash) {
    return generateHash(content) === hash;
}
//# sourceMappingURL=hashManager.js.map