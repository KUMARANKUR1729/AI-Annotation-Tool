"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHash = generateHash;
exports.verifyHash = verifyHash;
const crypto = require("crypto");
function generateHash(content) {
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 6);
}
function verifyHash(content, hash) {
    return generateHash(content) === hash;
}
//# sourceMappingURL=hashManager.js.map