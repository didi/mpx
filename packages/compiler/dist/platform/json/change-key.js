"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function changeKey(input, srcKey, targetKey) {
    const value = input[srcKey];
    delete input[srcKey];
    input[targetKey] = value;
    return input;
}
exports.default = changeKey;
//# sourceMappingURL=change-key.js.map