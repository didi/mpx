"use strict";
// const path = require('path')
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = exports.runtime = exports.lib = void 0;
// exports.lib = file => path.resolve(__dirname, '../', file)
// support npm link debug
const lib = (file) => '@mpxjs/webpack-plugin/lib/' + file;
exports.lib = lib;
const runtime = (file) => '@mpxjs/web-plugin/src/runtime/' + file;
exports.runtime = runtime;
const utils = (file) => '@mpxjs/utils/' + file;
exports.utils = utils;
module.exports.default && (module.exports = module.exports.default)
//# sourceMappingURL=normalize.js.map
