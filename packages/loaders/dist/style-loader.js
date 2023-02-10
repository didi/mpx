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
exports.mpxStyleTransform = void 0;
const postcss_1 = __importDefault(require("postcss"));
const compiler_1 = require("@mpxjs/compiler");
const compile_utils_1 = require("@mpxjs/compile-utils");
const plugin_proxy_1 = require("@mpxjs/plugin-proxy");
const constants_1 = require("./constants");
const mpxStyleTransform = function (css, pluginContext, options) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            var _a;
            const mpx = options.mpx;
            const { resourcePath, queryObj } = (0, compile_utils_1.parseRequest)(options.resource);
            const id = queryObj.moduleId ||
                queryObj.mid ||
                'm' + (mpx.pathHash && mpx.pathHash(resourcePath));
            const appInfo = mpx.appInfo || {};
            const defs = mpx.defs || {};
            const mode = mpx.mode;
            const isApp = options.isApp || resourcePath === appInfo.resourcePath;
            const transRpxRulesRaw = mpx.transRpxRules;
            const transRpxRules = transRpxRulesRaw
                ? Array.isArray(transRpxRulesRaw)
                    ? transRpxRulesRaw
                    : [transRpxRulesRaw]
                : [];
            const transRpxFn = (_a = mpx.webConfig) === null || _a === void 0 ? void 0 : _a.transRpxFn;
            const testResolveRange = (include = () => true, exclude) => {
                return (0, compile_utils_1.matchCondition)(resourcePath, { include, exclude });
            };
            const inlineConfig = Object.assign({}, mpx.postcssInlineConfig, { defs });
            compiler_1.styleCompiler.loadPostcssConfig(pluginContext, inlineConfig)
                .then(config => {
                const plugins = config.plugins.concat(compiler_1.styleCompiler.trim());
                // ali平台下处理scoped和host选择器
                if (mode === 'ali') {
                    if (queryObj.scoped) {
                        plugins.push(compiler_1.styleCompiler.scopeId({ id }));
                    }
                    plugins.push(compiler_1.styleCompiler.transSpecial({ id }));
                }
                plugins.push(compiler_1.styleCompiler.pluginCondStrip({
                    defs
                }));
                for (const item of transRpxRules) {
                    const { mode, comment, include, exclude, designWidth } = item || {};
                    if (testResolveRange(include, exclude)) {
                        // 对同一个资源一旦匹配到，推入一个rpx插件后就不再继续推了
                        plugins.push(compiler_1.styleCompiler.rpx({ mode, comment, designWidth }));
                        break;
                    }
                }
                if (mode === 'web') {
                    plugins.push(compiler_1.styleCompiler.vw({ transRpxFn }));
                }
                return (0, postcss_1.default)(plugins)
                    .process(css, Object.assign({ to: resourcePath, from: resourcePath, map: options.sourceMap
                        ? {
                            inline: false,
                            annotation: false,
                            prev: options.map
                        }
                        : false }, config.options))
                    .then(result => {
                    // ali环境添加全局样式抹平root差异
                    if (mode === 'ali' && isApp) {
                        result.css += `\n.${constants_1.MPX_ROOT_VIEW} { display: initial }\n.${constants_1.MPX_APP_MODULE_ID} { line-height: normal }`;
                    }
                    for (const warning of result.warnings()) {
                        pluginContext.warn(warning);
                    }
                    // todo 后续考虑直接使用postcss-loader来处理postcss
                    for (const message of result.messages) {
                        // eslint-disable-next-line default-case
                        switch (message.type) {
                            case 'dependency':
                                pluginContext.addDependency(message.file);
                                break;
                            case 'build-dependency':
                                pluginContext.addBuildDependency(message.file);
                                break;
                            case 'missing-dependency':
                                pluginContext.addMissingDependency(message.file);
                                break;
                            case 'context-dependency':
                                pluginContext.addContextDependency(message.file);
                                break;
                            case 'dir-dependency':
                                pluginContext.addContextDependency(message.dir);
                                break;
                            case 'asset':
                                if (message.content && message.file) {
                                    pluginContext.emitFile(message.file, message.content, message.sourceMap, message.info);
                                }
                        }
                    }
                    resolve({
                        code: result.css,
                        map: result.map && result.map.toJSON()
                    });
                });
            })
                .catch(e => {
                console.error(e);
                reject(e);
            });
        });
    });
};
exports.mpxStyleTransform = mpxStyleTransform;
exports.default = (function mpxStyleLoader(css, map) {
    this.cacheable();
    const cb = this.async();
    (0, exports.mpxStyleTransform)(css, (0, plugin_proxy_1.proxyPluginContext)(this), {
        map,
        resource: this.resource,
        sourceMap: this.sourceMap,
        // @ts-ignore
        mpx: this.getMpx()
    })
        .then((res) => {
        // @ts-ignore
        cb(null, res.code, res.map);
    })
        .catch(cb);
});
//# sourceMappingURL=style-loader.js.map