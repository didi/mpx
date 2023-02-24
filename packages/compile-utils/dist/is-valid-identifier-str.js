"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidIdentifierStr = void 0;
function isValidIdentifierStr(str) {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(str);
}
exports.isValidIdentifierStr = isValidIdentifierStr;
//# sourceMappingURL=is-valid-identifier-str.js.map
module.exports.default && (module.exports = module.exports.default)