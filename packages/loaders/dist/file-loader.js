"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const loader_utils_1 = __importDefault(require("loader-utils"));
const compile_utils_1 = require("@mpxjs/compile-utils");
const RecordResourceMapDependency_1 = __importDefault(require("@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency"));
const loader = function (content, prevOptions) {
    // @ts-ignore
    const options = prevOptions || loader_utils_1.default.getOptions(this) || {};
    const context = options.context || this.rootContext;
    // @ts-ignore
    let url = loader_utils_1.default.interpolateName(this, options.name, {
        context,
        content,
        regExp: options.regExp
    });
    let outputPath = url;
    if (options.publicPath) {
        if (options.outputPathCDN) {
            if (typeof options.outputPathCDN === 'function') {
                outputPath = options.outputPathCDN(outputPath, this.resourcePath, context);
            }
            else {
                outputPath = (0, compile_utils_1.toPosix)(path_1.default.join(options.outputPathCDN, outputPath));
            }
        }
    }
    else {
        const { resourcePath, queryObj } = (0, compile_utils_1.parseRequest)(this.resource);
        const packageRoot = queryObj.packageRoot || '';
        url = outputPath = (0, compile_utils_1.toPosix)(path_1.default.join(packageRoot, outputPath));
        this._module && this._module.addPresentationalDependency(new RecordResourceMapDependency_1.default(resourcePath, 'staticResource', outputPath, packageRoot));
    }
    let publicPath = `__webpack_public_path__ + ${JSON.stringify(url)}`;
    if (options.publicPath) {
        if (typeof options.publicPath === 'function') {
            publicPath = options.publicPath(url, this.resourcePath, context);
        }
        else {
            publicPath = `${options.publicPath.endsWith('/')
                ? options.publicPath
                : `${options.publicPath}/`}${url}`;
        }
        publicPath = JSON.stringify(publicPath);
    }
    this.emitFile(outputPath, content);
    // TODO revert to ES2015 Module export, when new CSS Pipeline is in place
    return `module.exports = ${publicPath};`;
};
// @ts-ignore
// 设置 raw，获取二进制数据
module.exports.raw = true;
exports.default = loader;
//# sourceMappingURL=file-loader.js.map