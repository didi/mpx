"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWxsPlugin = void 0;
const vite_1 = require("vite");
const compile_utils_1 = require("@mpxjs/compile-utils");
/**
 * wxs文件支持
 * @returns
 */
function createWxsPlugin() {
    const filter = (0, vite_1.createFilter)([/\.wxs$/]);
    return {
        name: 'vite:mpx-wxs',
        transform(code, id) {
            return __awaiter(this, void 0, void 0, function* () {
                const { resourcePath: filename } = (0, compile_utils_1.parseRequest)(id);
                if (!filter(filename))
                    return;
                return yield (0, vite_1.transformWithEsbuild)(code, '', {
                    format: 'esm',
                    sourcefile: filename
                });
            });
        }
    };
}
exports.createWxsPlugin = createWxsPlugin;
//# sourceMappingURL=wxs-plugin.js.map