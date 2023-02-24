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
exports.getJSONContent = exports.evalJSONJS = void 0;
const compile_utils_1 = require("@mpxjs/compile-utils");
const plugin_proxy_1 = require("@mpxjs/plugin-proxy");
const fs_1 = __importDefault(require("fs"));
const json5_1 = __importDefault(require("json5"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const constants_1 = require("../constants");
function evalJSONJS(source, filename, defs, fs, callback) {
    const defKeys = Object.keys(defs);
    const defValues = defKeys.map(key => {
        return defs[key];
    });
    const dirname = path_1.default.dirname(filename);
    // eslint-disable-next-line no-new-func
    const func = new Function('module', 'exports', 'require', '__filename', '__dirname', ...defKeys, source);
    const module = {
        exports: {}
    };
    // 此处采用readFileSync+evalJSONJS而不直接使用require获取依赖内容有两个原因：
    // 1. 支持依赖中正常访问defs变量
    // 2. 避免对应的依赖文件被作为buildDependencies
    func(module, module.exports, function (request) {
        if (request.startsWith('.')) {
            request = path_1.default.join(dirname, request);
        }
        const filename = require.resolve(request);
        callback(filename);
        const source = fs.readFileSync(filename).toString('utf-8');
        return evalJSONJS(source, filename, fs, defs || {}, callback);
    }, filename, dirname, ...defValues);
    return module.exports;
}
exports.evalJSONJS = evalJSONJS;
function getJSONContent(json, filename, pluginContext, defs, fs) {
    return __awaiter(this, void 0, void 0, function* () {
        let jsonPath = filename;
        if (json) {
            let jsonContent = json.content;
            let useJSONJS = json.useJSONJS;
            let resourcePath = '';
            if (json.src) {
                const resolvedJsonPath = yield pluginContext.resolve(json.src, filename);
                if (resolvedJsonPath) {
                    const { rawResourcePath } = (0, compile_utils_1.parseRequest)(resolvedJsonPath.id);
                    jsonPath = resolvedJsonPath.id;
                    useJSONJS = rawResourcePath.endsWith(constants_1.JSON_JS_EXT);
                    const readFile = (0, util_1.promisify)(fs.readFile);
                    jsonContent = yield readFile(rawResourcePath, 'utf-8');
                    json.content = jsonContent;
                    resourcePath = rawResourcePath;
                    pluginContext.addDependency(resolvedJsonPath.id);
                }
            }
            if (useJSONJS) {
                return {
                    content: JSON.stringify(evalJSONJS(jsonContent, resourcePath, defs || {}, fs, filename => {
                        pluginContext.addDependency(filename);
                    })),
                    path: jsonPath
                };
            }
            return {
                content: jsonContent,
                path: jsonPath
            };
        }
        return {
            content: '{}',
            path: jsonPath
        };
    });
}
exports.getJSONContent = getJSONContent;
/**
 * resolve json content
 * @param descriptor - SFCDescriptor
 * @param pluginContext - TransformPluginContext
 * @param options - ResolvedOptions
 * @returns json config
 */
function resolveJson(compilerResult, context, pluginContext, options, fsInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const { json } = compilerResult;
        const jsonContent = yield getJSONContent(json, context, (0, plugin_proxy_1.proxyPluginContext)(pluginContext), options.defs, fsInfo || fs_1.default);
        const jsonResult = json5_1.default.parse(jsonContent.content);
        if (jsonResult.tabBar) {
            jsonResult.tabBar = Object.assign(Object.assign({}, constants_1.DEFAULT_TAB_BAR_CONFIG), jsonResult.tabBar);
        }
        return Object.assign(Object.assign({}, jsonResult), { path: jsonContent.path });
    });
}
exports.default = resolveJson;
//# sourceMappingURL=resolve-json-content.js.map