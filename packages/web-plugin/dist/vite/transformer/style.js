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
exports.genStylesBlock = exports.transformStyle = void 0;
const compile_utils_1 = require("@mpxjs/compile-utils");
const loaders_1 = require("@mpxjs/loaders");
const plugin_proxy_1 = require("@mpxjs/plugin-proxy");
const pageHash_1 = __importDefault(require("../../utils/pageHash"));
const config_1 = require("../config");
const mpx_1 = __importDefault(require("../mpx"));
/**
 * transform style
 * @param code - style code
 * @param filename - filename
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
function transformStyle(code, filename, descriptor, options, pluginContext) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, loaders_1.mpxStyleTransform)(code, (0, plugin_proxy_1.proxyPluginContext)(pluginContext), {
            sourceMap: config_1.resolvedConfig.sourceMap,
            map: pluginContext.getCombinedSourcemap(),
            resource: filename,
            mpx: Object.assign(Object.assign(Object.assign({}, mpx_1.default), options), { pathHash: pageHash_1.default, isApp: descriptor.app })
        });
    });
}
exports.transformStyle = transformStyle;
/**
 * generate style block
 * @param descriptor - SFCDescriptor
 * @returns <style>descriptor.style</style>
 */
function genStylesBlock(descriptor) {
    const { styles } = descriptor;
    return { output: styles.map(style => (0, compile_utils_1.genComponentTag)(style)).join('\n') };
}
exports.genStylesBlock = genStylesBlock;
//# sourceMappingURL=style.js.map