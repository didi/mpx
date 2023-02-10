"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = void 0;
const parse_request_1 = require("./parse-request");
// todo 提供不记录dependency的resolve方法，非必要的情况下不记录dependency，提升缓存利用率
function resolve(context, request, loaderContext, callback) {
    const { queryObj } = (0, parse_request_1.parseRequest)(request);
    context = queryObj.context || context;
    return loaderContext.resolve(context, request, (err, resource, info) => {
        if (err)
            return callback(err);
        if (resource === false)
            return callback(new Error('Resolve ignored!'));
        callback(null, resource, info);
    });
}
exports.resolve = resolve;
//# sourceMappingURL=resolve.js.map
module.exports.default && (module.exports = module.exports.default)