"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loader_utils_1 = __importDefault(require("loader-utils"));
const mime_1 = __importDefault(require("mime"));
const compile_utils_1 = require("@mpxjs/compile-utils");
const getOptions = loader_utils_1.default.getOptions;
const urlLoader = function urlLoader(src) {
    let transBase64 = false;
    // @ts-ignore
    const options = Object.assign({}, getOptions(this));
    const { resourcePath, queryObj } = (0, compile_utils_1.parseRequest)(this.resource);
    const mimetype = options.mimetype || mime_1.default.getType(resourcePath);
    const publicPathScope = options.publicPathScope === 'all' ? 'all' : 'styleOnly';
    const limit = options.limit;
    const useLocal = !limit || src.length < limit || queryObj.useLocal;
    const isStyle = queryObj.isStyle;
    if (isStyle) {
        if (options.publicPath) {
            if (useLocal) {
                transBase64 = true;
            }
            if (queryObj.fallback) {
                transBase64 = false;
            }
        }
        else {
            transBase64 = true;
        }
    }
    else if (publicPathScope === 'styleOnly' || useLocal) {
        // 如果设置了publicPathScope为styleOnly且当前资源不为style时，则将传递给file-loader的publicPath删除，仅将style中的非local图像资源改为CDN地址
        // 否则全局的非local的图像资源都会被改为CDN地址
        delete options.publicPath;
    }
    if (transBase64) {
        if (typeof src === 'string') {
            src = Buffer.from(src);
        }
        return `module.exports = ${JSON.stringify(`data:${mimetype || ''};base64,${src.toString('base64')}`)}`;
    }
    else {
        const fallback = options.fallback
            ? require(options.fallback)
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            : require('./file-loader').default;
        return fallback.call(this, src, options);
    }
};
// @ts-ignore
// 设置 raw，获取二进制数据
module.exports.raw = true;
exports.default = urlLoader;
//# sourceMappingURL=url-loader.js.map