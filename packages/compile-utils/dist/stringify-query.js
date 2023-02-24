"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyQuery = void 0;
/**
 * stringify object to query string, started with '?'
 * @param {Object} obj
 * @param {boolean} useJSON
 * @return {string} queryString
 */
const json5_1 = __importDefault(require("json5"));
function stringifyQuery(obj, useJSON) {
    if (useJSON)
        return `?${json5_1.default.stringify(obj)}`;
    const res = obj
        ? Object.keys(obj)
            .sort()
            .map(key => {
            const val = obj[key];
            if (val === undefined) {
                return val;
            }
            if (val === true) {
                return key;
            }
            if (Array.isArray(val)) {
                const key2 = `${key}[]`;
                const result = [];
                val.slice().forEach(val2 => {
                    if (val2 === undefined) {
                        return;
                    }
                    result.push(`${key2}=${encodeURIComponent(val2)}`);
                });
                return result.join('&');
            }
            return `${key}=${encodeURIComponent(val)}`;
        })
            .filter(x => x)
            .join('&')
        : null;
    return res ? `?${res}` : '';
}
exports.stringifyQuery = stringifyQuery;
//# sourceMappingURL=stringify-query.js.map
module.exports.default && (module.exports = module.exports.default)