"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBrowser = exports.hasOwn = void 0;
const hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key);
}
exports.hasOwn = hasOwn;
exports.isBrowser = typeof window !== 'undefined';
//# sourceMappingURL=utils.js.map