"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compile_utils_1 = require("@mpxjs/compile-utils");
function default_1() {
    function convertTagName(name) {
        return (0, compile_utils_1.capitalToHyphen)(name);
    }
    return {
        // tag name contains capital letters
        test: /[A-Z]/,
        ali: convertTagName,
        swan: convertTagName
    };
}
exports.default = default_1;
//# sourceMappingURL=hypen-tag-name.js.map