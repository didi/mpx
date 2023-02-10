"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeObjectArray = exports.mergeObj = exports.mergeData = void 0;
const base_1 = require("./base");
const object_1 = require("./object");
const path_1 = require("./path");
function doMergeData(target, source) {
    Object.keys(source).forEach((srcKey) => {
        if ((0, object_1.hasOwn)(target, srcKey)) {
            target[srcKey] = source[srcKey];
        }
        else {
            let processed = false;
            const tarKeys = Object.keys(target);
            for (let i = 0; i < tarKeys.length; i++) {
                const tarKey = tarKeys[i];
                if ((0, path_1.aIsSubPathOfB)(tarKey, srcKey)) {
                    delete target[tarKey];
                    target[srcKey] = source[srcKey];
                    processed = true;
                    continue;
                }
                const subPath = (0, path_1.aIsSubPathOfB)(srcKey, tarKey);
                if (subPath) {
                    (0, path_1.setByPath)(target[tarKey], subPath, source[srcKey]);
                    processed = true;
                    break;
                }
            }
            if (!processed) {
                target[srcKey] = source[srcKey];
            }
        }
    });
    return target;
}
function mergeData(target, ...sources) {
    if (target) {
        sources.forEach((source) => {
            if (source)
                doMergeData(target, source);
        });
    }
    return target;
}
exports.mergeData = mergeData;
// 用于合并i18n语言集
function mergeObj(target, ...sources) {
    if ((0, base_1.isObject)(target)) {
        for (const source of sources) {
            if ((0, base_1.isObject)(source)) {
                Object.keys(source).forEach((key) => {
                    if ((0, base_1.isObject)(source[key]) && (0, base_1.isObject)(target[key])) {
                        mergeObj(target[key], source[key]);
                    }
                    else {
                        target[key] = source[key];
                    }
                });
            }
        }
    }
    return target;
}
exports.mergeObj = mergeObj;
function mergeObjectArray(arr) {
    const res = {};
    for (let i = 0; i < arr.length; i++) {
        if (arr[i]) {
            Object.assign(res, arr[i]);
        }
    }
    return res;
}
exports.mergeObjectArray = mergeObjectArray;
//# sourceMappingURL=merge.js.map
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)