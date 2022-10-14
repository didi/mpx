"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parse_request_1 = __importDefault(require("./parse-request"));
const stringify_query_1 = __importDefault(require("./stringify-query"));
const type_1 = __importDefault(require("./type"));
// 默认为非强行覆盖原query，如需强行覆盖传递force为true
function addQuery(request, data = {}, force, removeKeys) {
    const { rawResourcePath: resourcePath, loaderString, queryObj: queryObjRaw } = (0, parse_request_1.default)(request);
    const queryObj = Object.assign({}, queryObjRaw);
    if (force) {
        Object.assign(queryObj, data);
    }
    else {
        Object.keys(data).forEach(key => {
            if (!queryObj.hasOwnProperty(key)) {
                queryObj[key] = data[key];
            }
        });
    }
    if (removeKeys) {
        if ((0, type_1.default)(removeKeys) === 'String') {
            removeKeys = [removeKeys];
        }
        removeKeys.forEach(key => {
            delete queryObj[key];
        });
    }
    return ((loaderString ? `${loaderString}!` : '') +
        resourcePath +
        (0, stringify_query_1.default)(queryObj));
}
exports.default = addQuery;
module.exports.default && (module.exports = module.exports.default)
//# sourceMappingURL=add-query.js.map
