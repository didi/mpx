"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addQuery = void 0;
const parse_request_1 = require("./parse-request");
const stringify_query_1 = require("./stringify-query");
const type_1 = require("./type");
const has_own_1 = require("./has-own");
// 默认为非强行覆盖原query，如需强行覆盖传递force为true
function addQuery(request, data = {}, force, removeKeys) {
    const { rawResourcePath: resourcePath, loaderString, queryObj: queryObjRaw } = (0, parse_request_1.parseRequest)(request);
    const queryObj = Object.assign({}, queryObjRaw);
    if (force) {
        Object.assign(queryObj, data);
    }
    else {
        Object.keys(data).forEach((key) => {
            if (!(0, has_own_1.hasOwn)(queryObj, key)) {
                queryObj[key] = data[key];
            }
        });
    }
    if (removeKeys) {
        if ((0, type_1.type)(removeKeys) === 'String') {
            removeKeys = [removeKeys];
        }
        removeKeys.forEach(key => {
            delete queryObj[key];
        });
    }
    return ((loaderString ? `${loaderString}!` : '') +
        resourcePath +
        (0, stringify_query_1.stringifyQuery)(queryObj));
}
exports.addQuery = addQuery;
//# sourceMappingURL=add-query.js.map
module.exports.default && (module.exports = module.exports.default)