"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasChanged = exports.def = exports.hump2dash = exports.dash2hump = exports.aliasReplace = exports.isValidIdentifierStr = exports.isNumberStr = exports.isDef = exports.isEmptyObject = exports.isObject = exports.isFunction = exports.isArray = exports.isNumber = exports.isBoolean = exports.isString = exports.type = exports.noop = exports.hasProto = void 0;
const noop = () => { };
exports.noop = noop;
function isString(str) {
    return typeof str === 'string';
}
exports.isString = isString;
function isBoolean(bool) {
    return typeof bool === 'boolean';
}
exports.isBoolean = isBoolean;
function isNumber(num) {
    return typeof num === 'number';
}
exports.isNumber = isNumber;
function isArray(arr) {
    return Array.isArray(arr);
}
exports.isArray = isArray;
function isFunction(fn) {
    return typeof fn === 'function';
}
exports.isFunction = isFunction;
function isDef(v) {
    return v !== undefined && v !== null;
}
exports.isDef = isDef;
function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}
exports.isObject = isObject;
function isEmptyObject(obj) {
    if (!obj) {
        return true;
    }
    /* eslint-disable no-unreachable-loop */
    for (const key in obj) {
        return false;
    }
    return true;
}
exports.isEmptyObject = isEmptyObject;
function isNumberStr(str) {
    return /^\d+$/.test(str);
}
exports.isNumberStr = isNumberStr;
function isValidIdentifierStr(str) {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(str);
}
exports.isValidIdentifierStr = isValidIdentifierStr;
const hasProto = '__proto__' in {};
exports.hasProto = hasProto;
function dash2hump(value) {
    return value.replace(/-([a-z])/g, function (match, p1) {
        return p1.toUpperCase();
    });
}
exports.dash2hump = dash2hump;
function hump2dash(value) {
    return value.replace(/[A-Z]/g, function (match) {
        return '-' + match.toLowerCase();
    });
}
exports.hump2dash = hump2dash;
function def(obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable: !!enumerable,
        writable: true,
        configurable: true
    });
}
exports.def = def;
// type在支付宝环境下不一定准确，判断是普通对象优先使用isPlainObject（新版支付宝不复现，issue #644 修改isPlainObject实现与type等价）
function type(n) {
    return Object.prototype.toString.call(n).slice(8, -1);
}
exports.type = type;
function aliasReplace(options = {}, alias, target) {
    if (options[alias]) {
        if (Array.isArray(options[alias])) {
            options[target] = options[alias].concat(options[target] || []);
        }
        else if (isObject(options[alias])) {
            options[target] = Object.assign({}, options[alias], options[target]);
        }
        else {
            options[target] = options[alias];
        }
        delete options[alias];
    }
    return options;
}
exports.aliasReplace = aliasReplace;
// 比较一个值是否发生了变化（考虑NaN）。
function hasChanged(value, oldValue) {
    return !Object.is(value, oldValue);
}
exports.hasChanged = hasChanged;
//# sourceMappingURL=base.js.map
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)