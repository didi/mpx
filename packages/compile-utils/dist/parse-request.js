"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRequest = void 0;
const path_1 = __importDefault(require("path"));
const loader_utils_1 = require("loader-utils");
const seen = new Map();
function genQueryObj(result) {
    // 避免外部修改queryObj影响缓存
    result.queryObj = (0, loader_utils_1.parseQuery)(result.resourceQuery || '?');
    return result;
}
function parseRequest(request) {
    if (seen.has(request)) {
        return genQueryObj(seen.get(request));
    }
    const elements = request.split('!');
    const resource = elements.pop();
    const loaderString = elements.join('!');
    let resourcePath = resource;
    let resourceQuery = '';
    const queryIndex = resource.indexOf('?');
    if (queryIndex >= 0) {
        resourcePath = resource.slice(0, queryIndex);
        resourceQuery = resource.slice(queryIndex);
    }
    const queryObj = (0, loader_utils_1.parseQuery)(resourceQuery || '?');
    const rawResourcePath = resourcePath;
    if (queryObj.resourcePath) {
        resourcePath = queryObj.resourcePath;
    }
    else if (queryObj.infix) {
        const resourceDir = path_1.default.dirname(resourcePath);
        const resourceBase = path_1.default.basename(resourcePath);
        resourcePath = path_1.default.join(resourceDir, resourceBase.replace(queryObj.infix, ''));
    }
    const result = {
        resource,
        loaderString,
        resourcePath,
        resourceQuery,
        rawResourcePath,
        queryObj
    };
    seen.set(request, result);
    return result;
}
exports.parseRequest = parseRequest;
//# sourceMappingURL=parse-request.js.map
module.exports.default && (module.exports = module.exports.default)