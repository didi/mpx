"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capitalToHyphen = exports.isMustache = exports.isCapital = void 0;
function isCapital(c) {
    return /[A-Z]/.test(c);
}
exports.isCapital = isCapital;
function isMustache(str) {
    return /\{\{((?:.|\n|\r)+?)\}\}(?!})/.test(str);
}
exports.isMustache = isMustache;
// WordExample/wordExample -> word-example
function capitalToHyphen(v) {
    let ret = '';
    for (let c, i = 0; i < v.length; i++) {
        c = v[i];
        if (isCapital(c)) {
            if (i === 0) {
                c = c.toLowerCase();
            }
            else {
                c = '-' + c.toLowerCase();
            }
        }
        ret += c;
    }
    return ret;
}
exports.capitalToHyphen = capitalToHyphen;
module.exports.default && (module.exports = module.exports.default)
//# sourceMappingURL=string.js.map
