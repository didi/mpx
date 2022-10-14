"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isValidIdentifierStr(str) {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(str);
}
exports.default = isValidIdentifierStr;
module.exports.default && (module.exports = module.exports.default)
//# sourceMappingURL=is-valid-identifier-str.js.map
