"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shallowStringify = exports.stringifyObject = void 0;
const compile_utils_1 = require("@mpxjs/compile-utils");
const stringify = JSON.stringify.bind(JSON);
exports.default = stringify;
function stringifyObject(obj) {
    const result = {};
    if (obj) {
        Object.keys(obj).forEach((key) => {
            result[key] = stringify(obj[key]);
        });
    }
    return result;
}
exports.stringifyObject = stringifyObject;
function shallowStringify(obj) {
    const arr = [];
    for (const key in obj) {
        if ((0, compile_utils_1.hasOwn)(obj, key)) {
            let value = obj[key];
            if (Array.isArray(value)) {
                value = `[${value.join(',')}]`;
            }
            arr.push(`'${key}':${value}`);
        }
    }
    return `{${arr.join(',')}}`;
}
exports.shallowStringify = shallowStringify;
//# sourceMappingURL=stringify.js.map