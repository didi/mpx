"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parse_request_1 = __importDefault(require("./parse-request"));
// todo 提供不记录dependency的resolve方法，非必要的情况下不记录dependency，提升缓存利用率
exports.default = (context, request, loaderContext, callback) => {
    const { queryObj } = (0, parse_request_1.default)(request);
    context = queryObj.context || context;
    return loaderContext.resolve(context, request, (err, resource, info) => {
        if (err)
            return callback(err);
        if (resource === false)
            return callback(new Error('Resolve ignored!'));
        callback(null, resource, info);
    });
};
module.exports.default && (module.exports = module.exports.default)
//# sourceMappingURL=resolve.js.map
