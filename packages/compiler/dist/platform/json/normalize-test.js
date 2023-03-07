"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compile_utils_1 = require("@mpxjs/compile-utils");
function normalizeTest(test) {
    if (test) {
        return (input, meta) => {
            const pathArr = test.split('|');
            meta.paths = [];
            let result = false;
            for (let i = 0; i < pathArr.length; i++) {
                if ((0, compile_utils_1.hasOwn)(input, pathArr[i])) {
                    meta.paths.push(pathArr[i]);
                    result = true;
                }
            }
            return result;
        };
    }
    else {
        return () => true;
    }
}
exports.default = normalizeTest;
//# sourceMappingURL=normalize-test.js.map