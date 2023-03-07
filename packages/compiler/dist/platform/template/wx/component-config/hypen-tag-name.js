"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compile_utils_1 = require("@mpxjs/compile-utils");
exports.default = (function () {
    function convertTagName(name) {
        return (0, compile_utils_1.capitalToHyphen)(name);
    }
    return {
        // tag name contains capital letters
        test: /[A-Z]/,
        ali: convertTagName,
        swan: convertTagName
    };
});
//# sourceMappingURL=hypen-tag-name.js.map