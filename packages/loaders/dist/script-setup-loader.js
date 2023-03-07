"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compile_utils_1 = require("@mpxjs/compile-utils");
const compiler_1 = require("@mpxjs/compiler");
exports.default = (function scriptSetupLoader(content) {
    const { queryObj } = (0, compile_utils_1.parseRequest)(this.resource);
    const { ctorType, lang } = queryObj;
    const filePath = this.resourcePath;
    const { content: callbackContent } = (0, compiler_1.scriptSetupCompiler)({
        content,
        lang
    }, ctorType, filePath);
    this.callback(null, callbackContent);
});
//# sourceMappingURL=script-setup-loader.js.map