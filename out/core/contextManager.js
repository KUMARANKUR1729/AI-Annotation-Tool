"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContext = getContext;
const constants_1 = require("../utils/constants");
function getContext(languageId) {
    let s = "//", e = "";
    if (constants_1.SUPPORTED_HASH_LANGS.includes(languageId)) {
        s = "#";
    }
    else if (constants_1.HTML_LANGS.includes(languageId)) {
        s = "";
    }
    return { s, e };
}
//# sourceMappingURL=contextManager.js.map