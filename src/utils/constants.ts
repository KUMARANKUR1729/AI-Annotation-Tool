export const AI_START = "AI_START";
export const AI_END = "AI_END";

export const AI_GEN_START = "###AI_GEN_START###";
export const AI_GEN_END = "###AI_GEN_END###";
export const AI_EDITED = "###AI_EDITED";

export const MIN_AI_LINES = 4;      // Minimum non-empty lines to consider a paste as AI-generated
export const MIN_AI_LENGTH = 80;    // Minimum character count (was 20 — caused constant false positives)
export const DEBOUNCE_DELAY = 1000; // ms to wait after a paste before annotating