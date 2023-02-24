/* eslint-disable @typescript-eslint/no-var-requires */
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ResolveDependency_1 = __importDefault(require("@mpxjs/webpack-plugin/lib/dependencies/ResolveDependency"));
const InjectDependency_1 = __importDefault(require("@mpxjs/webpack-plugin/lib/dependencies/InjectDependency"));
const CommonJsVariableDependency_1 = __importDefault(require("@mpxjs/webpack-plugin/lib/dependencies/CommonJsVariableDependency"));
const ReplaceDependency_1 = __importDefault(require("@mpxjs/webpack-plugin/lib/dependencies/ReplaceDependency"));
const RecordResourceMapDependency_1 = __importDefault(require("@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency"));
const RecordVueContentDependency_1 = __importDefault(require("@mpxjs/webpack-plugin/lib/dependencies/RecordVueContentDependency"));
const NullFactory_1 = __importDefault(require("webpack/lib/NullFactory"));
const HarmonyImportDependencyParserPlugin_1 = __importDefault(require("webpack/lib/dependencies/HarmonyImportDependencyParserPlugin"));
const FlagEntryExportAsUsedPlugin_1 = __importDefault(require("webpack/lib/FlagEntryExportAsUsedPlugin"));
const FileSystemInfo_1 = __importDefault(require("webpack/lib/FileSystemInfo"));
const AddModePlugin_1 = __importDefault(require("@mpxjs/webpack-plugin/lib/resolver/AddModePlugin"));
const AddEnvPlugin_1 = __importDefault(require("@mpxjs/webpack-plugin/lib/resolver/AddEnvPlugin"));
const compile_utils_1 = require("@mpxjs/compile-utils");
const async_1 = __importDefault(require("async"));
const options_1 = require("../options");
const mpx_1 = __importDefault(require("./mpx"));
const webpack_1 = require("webpack");
const get_output_path_1 = __importDefault(require("../utils/get-output-path"));
const styleCompilerPath = require.resolve('@mpxjs/loaders/style-loader.js');
const isProductionLikeMode = (options) => {
    return options.mode === 'production' || !options.mode;
};
const warnings = [];
const errors = [];
class MpxWebpackPlugin {
    constructor(options) {
        options = options || {};
        this.options = (0, options_1.processOptions)(options);
        // Hack for buildDependencies
        const rawResolveBuildDependencies = FileSystemInfo_1.default.prototype.resolveBuildDependencies;
        FileSystemInfo_1.default.prototype.resolveBuildDependencies = function (context, deps, rawCallback) {
            return rawResolveBuildDependencies.call(this, context, deps, (err, result) => {
                if (result &&
                    typeof options.hackResolveBuildDependencies === 'function')
                    options.hackResolveBuildDependencies(result);
                return rawCallback(err, result);
            });
        };
    }
    static loader(options) {
        if (options.transRpx) {
            warnings.push('Mpx loader option [transRpx] is deprecated now, please use mpx webpack plugin config [transRpxRules] instead!');
        }
        return {
            loader: '@mpxjs/web-plugin/dist/webpack/loader/web-loader',
            options
        };
    }
    static wxsPreLoader(options = {}) {
        return {
            loader: '@mpxjs/loaders/pre-loader',
            options
        };
    }
    static urlLoader(options = {}) {
        return {
            loader: '@mpxjs/loaders/url-loader',
            options
        };
    }
    static fileLoader(options = {}) {
        return {
            loader: '@mpxjs/loaders/file-loader',
            options
        };
    }
    runModeRules(data) {
        var _a, _b;
        const { resourcePath, queryObj } = (0, compile_utils_1.parseRequest)(data.resource);
        if (queryObj.mode) {
            return;
        }
        const mode = this.options.mode;
        const modeRule = (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.modeRules) === null || _b === void 0 ? void 0 : _b.mode;
        if (!modeRule) {
            return;
        }
        if ((0, compile_utils_1.matchCondition)(resourcePath, modeRule)) {
            data.resource = (0, compile_utils_1.addQuery)(data.resource, { mode });
            data.request = (0, compile_utils_1.addQuery)(data.request, { mode });
        }
    }
    apply(compiler) {
        if (!compiler.__mpx__) {
            compiler.__mpx__ = true;
        }
        else {
            errors.push('Multiple MpxWebpackPlugin instances exist in webpack compiler, please check webpack plugins config!');
        }
        // 将entry export标记为used且不可mangle，避免require.async生成的js chunk在生产环境下报错
        new FlagEntryExportAsUsedPlugin_1.default(true, 'entry').apply(compiler);
        if (!compiler.options.node || !compiler.options.node.global) {
            compiler.options.node = compiler.options.node || {};
            compiler.options.node.global = true;
        }
        const addModePlugin = new AddModePlugin_1.default('before-file', this.options.mode || 'web', this.options.fileConditionRules, 'file');
        const addEnvPlugin = new AddEnvPlugin_1.default('before-file', this.options.env || '', this.options.fileConditionRules, 'file');
        if (Array.isArray(compiler.options.resolve.plugins)) {
            compiler.options.resolve.plugins.push(addModePlugin);
        }
        else {
            compiler.options.resolve.plugins = [addModePlugin];
        }
        if (this.options.env) {
            compiler.options.resolve.plugins.push(addEnvPlugin);
        }
        // 代理writeFile
        if (this.options.writeMode === 'changed') {
            const writedFileContentMap = new Map();
            const originalWriteFile = compiler.outputFileSystem.writeFile;
            compiler.outputFileSystem.writeFile = (filePath, content, callback) => {
                const lastContent = writedFileContentMap.get(filePath);
                if (Buffer.isBuffer(lastContent)
                    ? lastContent.equals(content)
                    : lastContent === content) {
                    return callback();
                }
                writedFileContentMap.set(filePath, content);
                originalWriteFile(filePath, content, callback);
                return '';
            };
        }
        const defs = this.options.defs || {};
        const defsOpt = {
            __mpx_wxs__: webpack_1.DefinePlugin.runtimeValue(({ module }) => {
                return JSON.stringify(!!module.wxs);
            })
        };
        Object.keys(defs).forEach(key => {
            defsOpt[key] = JSON.stringify(defs[key]);
        });
        // define mode & defs
        new webpack_1.DefinePlugin(defsOpt).apply(compiler);
        new webpack_1.ExternalsPlugin('commonjs2', this.options.externals || []).apply(compiler);
        compiler.hooks.compilation.tap('MpxWebpackPlugin ', (compilation, { normalModuleFactory }) => {
            webpack_1.NormalModule.getCompilationHooks(compilation).loader.tap('MpxWebpackPlugin', (loaderContext) => {
                // 设置loaderContext的minimize
                if (isProductionLikeMode(compiler.options)) {
                    mpx_1.default.minimize = true;
                }
                loaderContext.getMpx = () => {
                    return mpx_1.default;
                };
            });
            compilation.dependencyFactories.set(ResolveDependency_1.default, new NullFactory_1.default());
            compilation.dependencyTemplates.set(ResolveDependency_1.default, new ResolveDependency_1.default.Template());
            compilation.dependencyFactories.set(InjectDependency_1.default, new NullFactory_1.default());
            compilation.dependencyTemplates.set(InjectDependency_1.default, new InjectDependency_1.default.Template());
            compilation.dependencyFactories.set(ReplaceDependency_1.default, new NullFactory_1.default());
            compilation.dependencyTemplates.set(ReplaceDependency_1.default, new ReplaceDependency_1.default.Template());
            compilation.dependencyFactories.set(CommonJsVariableDependency_1.default, normalModuleFactory);
            compilation.dependencyTemplates.set(CommonJsVariableDependency_1.default, new CommonJsVariableDependency_1.default.Template());
            compilation.dependencyFactories.set(RecordResourceMapDependency_1.default, new NullFactory_1.default());
            compilation.dependencyTemplates.set(RecordResourceMapDependency_1.default, new RecordResourceMapDependency_1.default.Template());
            compilation.dependencyFactories.set(RecordVueContentDependency_1.default, new NullFactory_1.default());
            compilation.dependencyTemplates.set(RecordVueContentDependency_1.default, new RecordVueContentDependency_1.default.Template());
        });
        compiler.hooks.thisCompilation.tap('MpxWebpackPlugin', (compilation, { normalModuleFactory }) => {
            compilation.warnings = compilation.warnings.concat(warnings);
            compilation.errors = compilation.errors.concat(errors);
            const moduleGraph = compilation.moduleGraph;
            if (!compilation.__mpx__) {
                Object.assign(mpx_1.default, Object.assign(Object.assign({}, this.options), { appInfo: {}, 
                    // pages全局记录，无需区分主包分包
                    pagesMap: {}, 
                    // 组件资源记录，依照所属包进行记录
                    componentsMap: {
                        main: {}
                    }, staticResourcesMap: {
                        main: {}
                    }, usingComponents: {}, currentPackageRoot: '', wxsContentMap: {}, minimize: false, 
                    // 输出web专用配置
                    appTitle: 'Index homepage', vueContentCache: new Map(), recordResourceMap: ({ resourcePath, resourceType, outputPath, packageRoot = '', recordOnly, warn, error }) => {
                        const packageName = packageRoot || 'main';
                        const resourceMap = mpx_1.default[`${resourceType}sMap`];
                        const currentResourceMap = resourceMap.main
                            ? (resourceMap[packageName] = resourceMap[packageName] || {})
                            : resourceMap;
                        let alreadyOutputted = false;
                        if (outputPath) {
                            if (!currentResourceMap[resourcePath] ||
                                currentResourceMap[resourcePath] === true) {
                                if (!recordOnly) {
                                    // 在非recordOnly的模式下，进行输出路径冲突检测，如果存在输出路径冲突，则对输出路径进行重命名
                                    for (const key in currentResourceMap) {
                                        // todo 用outputPathMap来检测输出路径冲突
                                        if (currentResourceMap[key] === outputPath &&
                                            key !== resourcePath) {
                                            outputPath =
                                                (0, get_output_path_1.default)(resourcePath, resourceType, mpx_1.default, {
                                                    conflictPath: outputPath
                                                }) || '';
                                            warn &&
                                                warn(new Error(`Current ${resourceType} [${resourcePath}] is registered with conflicted outputPath [${currentResourceMap[key]}] which is already existed in system, will be renamed with [${outputPath}], use ?resolve to get the real outputPath!`));
                                            break;
                                        }
                                    }
                                }
                                currentResourceMap[resourcePath] = outputPath;
                            }
                            else {
                                if (currentResourceMap[resourcePath] === outputPath) {
                                    alreadyOutputted = true;
                                }
                                else {
                                    error &&
                                        error(new Error(`Current ${resourceType} [${resourcePath}] is already registered with outputPath [${currentResourceMap[resourcePath]}], you can not register it with another outputPath [${outputPath}]!`));
                                }
                            }
                        }
                        else if (!currentResourceMap[resourcePath]) {
                            currentResourceMap[resourcePath] = true;
                        }
                        return {
                            outputPath,
                            alreadyOutputted
                        };
                    } }));
                compilation.__mpx__ = mpx_1.default;
            }
            const rawProcessModuleDependencies = compilation.processModuleDependencies;
            compilation.processModuleDependencies = (module, callback) => {
                const presentationalDependencies = module.presentationalDependencies || [];
                async_1.default.forEach(presentationalDependencies.filter((dep) => dep.mpxAction), (dep, callback) => {
                    dep.mpxAction(module, compilation, callback);
                }, err => {
                    rawProcessModuleDependencies.call(compilation, module, innerErr => {
                        const cbError = err || innerErr;
                        return callback(cbError);
                    });
                });
            };
            const normalModuleFactoryParserCallback = (parser) => {
                parser.hooks.call
                    .for('__mpx_resolve_path__')
                    .tap('MpxWebpackPlugin', (expr) => {
                    if (expr.arguments[0]) {
                        const resource = expr.arguments[0].value;
                        const packageName = mpx_1.default.currentPackageRoot || 'main';
                        const module = parser.state.module;
                        const moduleGraphReturn = moduleGraph.getIssuer(module);
                        const resource1 = moduleGraphReturn.resource;
                        const issuerResource = resource1;
                        const range = expr.range;
                        const dep = new ResolveDependency_1.default(resource, packageName, issuerResource, range);
                        parser.state.current.addPresentationalDependency(dep);
                        return true;
                    }
                });
                // hack babel polyfill global
                parser.hooks.statementIf.tap('MpxWebpackPlugin', (expr) => {
                    if (/core-js.+microtask/.test(parser.state.module.resource)) {
                        if (expr.test.left &&
                            (expr.test.left.name === 'Observer' ||
                                expr.test.left.name === 'MutationObserver')) {
                            const current = parser.state.current;
                            current.addPresentationalDependency(new InjectDependency_1.default({
                                content: 'document && ',
                                index: expr.test.range[0]
                            }));
                        }
                    }
                });
                parser.hooks.evaluate
                    .for('CallExpression')
                    .tap('MpxWebpackPlugin', (expr) => {
                    const current = parser.state.current;
                    const arg0 = expr.arguments[0];
                    const arg1 = expr.arguments[1];
                    const callee = expr.callee;
                    // todo 该逻辑在corejs3中不需要，等corejs3比较普及之后可以干掉
                    if (/core-js.+global/.test(parser.state.module.resource)) {
                        if (callee.name === 'Function' &&
                            arg0 &&
                            arg0.value === 'return this') {
                            current.addPresentationalDependency(new InjectDependency_1.default({
                                content: '(function() { return this })() || ',
                                index: expr.range[0]
                            }));
                        }
                    }
                    if (/regenerator/.test(parser.state.module.resource)) {
                        if (callee.name === 'Function' &&
                            arg0 &&
                            arg0.value === 'r' &&
                            arg1 &&
                            arg1.value === 'regeneratorRuntime = r') {
                            current.addPresentationalDependency(new ReplaceDependency_1.default('(function () {})', expr.range));
                        }
                    }
                });
                // 处理跨平台转换
                if (mpx_1.default.srcMode !== mpx_1.default.mode) {
                    // 处理跨平台全局对象转换
                    const transGlobalObject = (expr) => {
                        const module = parser.state.module;
                        const current = parser.state.current;
                        const { queryObj, resourcePath } = (0, compile_utils_1.parseRequest)(module.resource);
                        const localSrcMode = queryObj.mode;
                        const globalSrcMode = mpx_1.default.srcMode;
                        const srcMode = localSrcMode || globalSrcMode;
                        const mode = mpx_1.default.mode;
                        let target;
                        if (expr.type === 'Identifier') {
                            target = expr;
                        }
                        else if (expr.type === 'MemberExpression') {
                            target = expr.object;
                        }
                        if (!(0, compile_utils_1.matchCondition)(resourcePath, this.options.transMpxRules) ||
                            resourcePath.indexOf('@mpxjs') !== -1 ||
                            !target ||
                            mode === srcMode)
                            return;
                        const type = target.name;
                        const name = type === 'wx' ? 'mpx' : 'createFactory';
                        const replaceContent = type === 'wx' ? 'mpx' : `createFactory(${JSON.stringify(type)})`;
                        const dep = new ReplaceDependency_1.default(replaceContent, target.range);
                        current.addPresentationalDependency(dep);
                        let needInject = true;
                        for (const dep of module.dependencies) {
                            if (dep instanceof CommonJsVariableDependency_1.default &&
                                dep.name === name) {
                                needInject = false;
                                break;
                            }
                        }
                        if (needInject) {
                            const dep = new CommonJsVariableDependency_1.default(`@mpxjs/core/src/runtime/${name}`, name);
                            module.addDependency(dep);
                        }
                    };
                    // 转换wx全局对象
                    parser.hooks.expression
                        .for('wx')
                        .tap('MpxWebpackPlugin', transGlobalObject);
                    // 为跨平台api调用注入srcMode参数指导api运行时转换
                    const apiBlackListMap = [
                        'createApp',
                        'createPage',
                        'createComponent',
                        'createStore',
                        'createStoreWithThis',
                        'mixin',
                        'injectMixins',
                        'toPureObject',
                        'observable',
                        'watch',
                        'use',
                        'set',
                        'remove',
                        'delete',
                        'setConvertRule',
                        'getMixin',
                        'getComputed',
                        'implement'
                    ].reduce((map, api) => {
                        map[api] = true;
                        return map;
                    }, {});
                    const injectSrcModeForTransApi = (expr, members) => {
                        // members为空数组时，callee并不是memberExpression
                        if (!members.length)
                            return;
                        const callee = expr.callee;
                        const args = expr.arguments;
                        const name = callee.object.name;
                        const { queryObj, resourcePath } = (0, compile_utils_1.parseRequest)(parser.state.module.resource);
                        const localSrcMode = queryObj.mode;
                        const globalSrcMode = mpx_1.default.srcMode;
                        const srcMode = localSrcMode || globalSrcMode;
                        if (srcMode === globalSrcMode ||
                            apiBlackListMap[callee.property.name || callee.property.value] ||
                            (name !== 'mpx' && name !== 'wx') ||
                            (name === 'wx' &&
                                !(0, compile_utils_1.matchCondition)(resourcePath, this.options.transMpxRules)))
                            return;
                        const srcModeString = `__mpx_src_mode_${srcMode}__`;
                        const dep = new InjectDependency_1.default({
                            content: args.length
                                ? `, ${JSON.stringify(srcModeString)}`
                                : JSON.stringify(srcModeString),
                            index: expr.end - 1
                        });
                        parser.state.current.addPresentationalDependency(dep);
                    };
                    parser.hooks.callMemberChain
                        .for(HarmonyImportDependencyParserPlugin_1.default)
                        .tap('MpxWebpackPlugin', injectSrcModeForTransApi);
                    parser.hooks.callMemberChain
                        .for('mpx')
                        .tap('MpxWebpackPlugin', injectSrcModeForTransApi);
                    parser.hooks.callMemberChain
                        .for('wx')
                        .tap('MpxWebpackPlugin', injectSrcModeForTransApi);
                }
            };
            normalModuleFactory.hooks.parser
                .for('javascript/auto')
                .tap('MpxWebpackPlugin', normalModuleFactoryParserCallback);
            normalModuleFactory.hooks.parser
                .for('javascript/dynamic')
                .tap('MpxWebpackPlugin', normalModuleFactoryParserCallback);
            normalModuleFactory.hooks.parser
                .for('javascript/esm')
                .tap('MpxWebpackPlugin', normalModuleFactoryParserCallback);
        });
        compiler.hooks.normalModuleFactory.tap('MpxWebpackPlugin', normalModuleFactory => {
            // resolve前修改原始request
            normalModuleFactory.hooks.beforeResolve.tap('MpxWebpackPlugin', data => {
                const request = data.request;
                const { queryObj, resource } = (0, compile_utils_1.parseRequest)(request);
                if (queryObj.resolve) {
                    // 此处的query用于将资源引用的当前包信息传递给resolveDependency
                    const resolveLoaderPath = '@mpxjs/loaders/resolve-loader';
                    data.request = `!!${resolveLoaderPath}!${resource}`;
                }
            });
            // 应用过rules后，注入mpx相关资源编译loader
            normalModuleFactory.hooks.afterResolve.tap('MpxWebpackPlugin', ({ createData }) => {
                const { queryObj } = (0, compile_utils_1.parseRequest)(createData.request || '');
                const loaders = createData.loaders;
                const mpxStyleOptions = queryObj.mpxStyleOptions;
                const firstLoader = loaders && loaders[0] ? (0, compile_utils_1.toPosix)(loaders[0].loader) : '';
                const isPitcherRequest = firstLoader.includes('vue-loader/lib/loaders/pitcher');
                let cssLoaderIndex = -1;
                let vueStyleLoaderIndex = -1;
                let mpxStyleLoaderIndex = -1;
                loaders &&
                    loaders.forEach((loader, index) => {
                        const currentLoader = (0, compile_utils_1.toPosix)(loader.loader);
                        if (currentLoader.includes('css-loader') &&
                            cssLoaderIndex === -1) {
                            cssLoaderIndex = index;
                        }
                        else if (currentLoader.includes('vue-loader/lib/loaders/stylePostLoader') &&
                            vueStyleLoaderIndex === -1) {
                            vueStyleLoaderIndex = index;
                        }
                        else if (currentLoader.includes(styleCompilerPath) &&
                            mpxStyleLoaderIndex === -1) {
                            mpxStyleLoaderIndex = index;
                        }
                    });
                if (mpxStyleLoaderIndex === -1) {
                    let loaderIndex = -1;
                    if (cssLoaderIndex > -1 && vueStyleLoaderIndex === -1) {
                        loaderIndex = cssLoaderIndex;
                    }
                    else if (cssLoaderIndex > -1 &&
                        vueStyleLoaderIndex > -1 &&
                        !isPitcherRequest) {
                        loaderIndex = vueStyleLoaderIndex;
                    }
                    if (loaderIndex > -1) {
                        // @ts-ignore
                        loaders &&
                            loaders.splice(loaderIndex + 1, 0, {
                                loader: styleCompilerPath,
                                options: (mpxStyleOptions && JSON.parse(mpxStyleOptions)) || {}
                            });
                    }
                }
                createData.request = (0, compile_utils_1.stringifyLoadersAndResource)(loaders, createData.resource || '');
                // 根据用户传入的modeRules对特定资源添加mode query
                this.runModeRules(createData);
            });
        });
    }
}
exports.default = MpxWebpackPlugin;
//# sourceMappingURL=index.js.map