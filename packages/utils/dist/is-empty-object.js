"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isEmptyObject(obj) {
    if (!obj) {
        return true;
    }
    for (let _ in obj) {
        return false;
    }
    return true;
}
exports.default = isEmptyObject;
module.exports.default && (module.exports = module.exports.default)
//# sourceMappingURL=is-empty-object.js.map
