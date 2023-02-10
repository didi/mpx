"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmptyObject = void 0;
function isEmptyObject(obj) {
    if (!obj) {
        return true;
    }
    // @ts-ignore
    for (const key in obj) {
        return false;
    }
    return true;
}
exports.isEmptyObject = isEmptyObject;
//# sourceMappingURL=is-empty-object.js.map
module.exports.default && (module.exports = module.exports.default)