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
exports.createResolveEntryPlugin = void 0;
const vite_1 = require("vite");
const compile_utils_1 = require("@mpxjs/compile-utils");
const helper_1 = require("../helper");
const mpx_1 = __importDefault(require("../mpx"));
/**
 * 推断mpx入口文件并记录的插件
 * @param options - Options
 * @returns
 */
function createResolveEntryPlugin(options) {
    const filter = (0, vite_1.createFilter)([/\.mpx$/]);
    return {
        name: 'vite:mpx-resolve-entry',
        enforce: 'pre',
        resolveId(source, importer, options) {
            return __awaiter(this, void 0, void 0, function* () {
                const { queryObj: query, resourcePath: filename } = (0, compile_utils_1.parseRequest)(source);
                if (!filter(filename))
                    return;
                if (query.resolve === undefined &&
                    query.vue === undefined &&
                    query.app === undefined &&
                    query.isPage === undefined &&
                    query.isComponent === undefined) {
                    // entry mpx
                    const resolution = yield this.resolve(source, importer, Object.assign({ skipSelf: true }, options));
                    if (resolution) {
                        if (mpx_1.default.entry === undefined) {
                            mpx_1.default.entry = resolution.id;
                        }
                        if (mpx_1.default.entry === resolution.id) {
                            return helper_1.ENTRY_HELPER_CODE;
                        }
                    }
                }
                if (query.resolve) {
                    const resolution = yield this.resolve(source, importer, Object.assign({ skipSelf: true }, options));
                    if (resolution) {
                        // 跳过vue-plugin
                        return (0, compile_utils_1.addQuery)(resolution.id, {
                            raw: true
                        });
                    }
                }
            });
        },
        load(id) {
            if (id === helper_1.ENTRY_HELPER_CODE && mpx_1.default.entry) {
                return (0, helper_1.renderEntryCode)(mpx_1.default.entry, options);
            }
            const { resourcePath: filename, queryObj: query } = (0, compile_utils_1.parseRequest)(id);
            if (!filter(filename))
                return;
            if (!!query.resolve) {
                // 强制改raw
                return (0, helper_1.renderPageRouteCode)(options, filename);
            }
        }
    };
}
exports.createResolveEntryPlugin = createResolveEntryPlugin;
//# sourceMappingURL=resolveEntryPlugin.js.map