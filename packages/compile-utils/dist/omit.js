"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omit = void 0;
function omit(obj, omitKeys) {
    const result = Object.assign({}, obj);
    omitKeys.forEach((key) => delete result[key]);
    return result;
}
exports.omit = omit;
//# sourceMappingURL=omit.js.map