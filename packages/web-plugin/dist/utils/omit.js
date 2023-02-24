"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function omit(obj, omitKeys) {
    const result = Object.assign({}, obj);
    omitKeys.forEach((key) => delete result[key]);
    return result;
}
exports.default = omit;
//# sourceMappingURL=omit.js.map