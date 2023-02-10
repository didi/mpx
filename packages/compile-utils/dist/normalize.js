"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalize = void 0;
exports.normalize = {
    lib: (file) => '@mpxjs/webpack-plugin/lib/' + file,
    runtime: (file) => '@mpxjs/web-plugin/src/runtime/' + file,
    utils: (file) => '@mpxjs/compile-utils/' + file
};
//# sourceMappingURL=normalize.js.map
module.exports.default && (module.exports = module.exports.default)