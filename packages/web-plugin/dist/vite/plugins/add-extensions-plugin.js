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
exports.customExtensionsPlugin = exports.esbuildCustomExtensionsPlugin = void 0;
const compile_utils_1 = require("@mpxjs/compile-utils");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const vite_1 = require("vite");
/**
 * generate file path with mode
 * @param originPath - path/to/index.js
 * @param extendsion - string
 * @returns path/to/index.extendsion.js
 */
function genExtensionsFilePath(filename, extendsion) {
    const parseResult = path_1.default.parse(filename);
    return path_1.default.format(Object.assign(Object.assign({}, parseResult), { name: `${parseResult.name}.${extendsion}`, base: undefined }));
}
function esbuildCustomExtensionsPlugin(options) {
    return {
        name: 'esbuild:mpx-custom-estensions',
        setup(build) {
            build.onLoad({ filter: options.include }, (args) => __awaiter(this, void 0, void 0, function* () {
                if (!(0, compile_utils_1.matchCondition)(args.path, options.fileConditionRules))
                    return;
                for (const extendsion of options.extensions) {
                    try {
                        const filePath = genExtensionsFilePath(args.path, extendsion);
                        yield fs_1.default.promises.access(filePath);
                        return {
                            contents: yield fs_1.default.promises.readFile(filePath, 'utf-8')
                        };
                    }
                    catch (_a) { }
                }
            }));
        }
    };
}
exports.esbuildCustomExtensionsPlugin = esbuildCustomExtensionsPlugin;
/**
 * add custom extensions plugin
 * @param options - options
 * @returns vite plugin options
 */
function customExtensionsPlugin(options) {
    const filter = (0, vite_1.createFilter)(options.include);
    return {
        name: 'vite:mpx-custom-estensions',
        load(id) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!filter(id) || !(0, compile_utils_1.matchCondition)(id, options.fileConditionRules))
                    return;
                const { resourcePath: filename, queryObj: query } = (0, compile_utils_1.parseRequest)(id);
                if (query.vue)
                    return;
                for (const extendsion of options.extensions) {
                    try {
                        const filePath = genExtensionsFilePath(filename, extendsion);
                        yield fs_1.default.promises.access(filePath);
                        return yield fs_1.default.promises.readFile(filePath, 'utf-8');
                    }
                    catch (_a) { }
                }
            });
        }
    };
}
exports.customExtensionsPlugin = customExtensionsPlugin;
//# sourceMappingURL=add-extensions-plugin.js.map