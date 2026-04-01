"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEBOUNCE_DELAY = exports.MIN_AI_LENGTH = exports.MIN_AI_LINES = exports.AI_EDITED = exports.AI_GEN_END = exports.AI_GEN_START = exports.AI_END = exports.AI_START = void 0;
exports.AI_START = "AI_START";
exports.AI_END = "AI_END";
exports.AI_GEN_START = "###AI_GEN_START###";
exports.AI_GEN_END = "###AI_GEN_END###";
exports.AI_EDITED = "###AI_EDITED";
exports.MIN_AI_LINES = 4; // Minimum non-empty lines to consider a paste as AI-generated
exports.MIN_AI_LENGTH = 80; // Minimum character count (was 20 — caused constant false positives)
exports.DEBOUNCE_DELAY = 1000; // ms to wait after a paste before annotating
//# sourceMappingURL=constants.js.map