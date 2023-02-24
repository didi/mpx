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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMpxOutSideJsPlugin = void 0;
const vite_1 = require("vite");
const compile_utils_1 = require("@mpxjs/compile-utils");
const magic_string_1 = __importDefault(require("magic-string"));
const config_1 = require("../config");
const stringify_1 = __importDefault(require("../../utils/stringify"));
const descriptorCache_1 = require("../utils/descriptorCache");
/**
 * 给外联的js加上global配置
 * @returns
 */
function createMpxOutSideJsPlugin() {
    const filter = (0, vite_1.createFilter)([/\.(js|ts)$/]);
    return {
        name: 'vite:mpx-outside-js',
        transform(code, id) {
            return __awaiter(this, void 0, void 0, function* () {
                const { resourcePath: filename } = (0, compile_utils_1.parseRequest)(id);
                if (!filter(filename))
                    return;
                const descriptor = (0, descriptorCache_1.getDescriptor)(filename);
                if (!descriptor)
                    return;
                const s = new magic_string_1.default(code);
                !config_1.resolvedConfig.isProduction &&
                    s.prepend(`global.currentResource = ${(0, stringify_1.default)(filename)}\n`);
                s.prepend(`global.currentModuleId = ${(0, stringify_1.default)(descriptor.id)}\n`);
                return {
                    code: s.toString(),
                    map: s.generateMap({
                        file: filename + '.map',
                        source: filename
                    })
                };
            });
        }
    };
}
exports.createMpxOutSideJsPlugin = createMpxOutSideJsPlugin;
//# sourceMappingURL=outsideJs.js.map