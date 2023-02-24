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
exports.jsonCompiler = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const RecordResourceMapDependency_1 = __importDefault(require("@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency"));
const parser_1 = __importDefault(require("@mpxjs/compiler/template-compiler/parser"));
const json_helper_1 = __importDefault(require("./json-helper"));
const plugin_proxy_1 = require("@mpxjs/plugin-proxy");
const compile_utils_1 = require("@mpxjs/compile-utils");
const descriptorCache_1 = require("../vite/utils/descriptorCache");
const resolve_json_content_1 = __importDefault(require("../utils/resolve-json-content"));
const get_output_path_1 = __importDefault(require("../utils/get-output-path"));
const resolveModuleContext_1 = __importDefault(require("../utils/resolveModuleContext"));
const jsonCompiler = function ({ jsonConfig, pluginContext, context, options, mode, mpx }) {
    return __awaiter(this, void 0, void 0, function* () {
        const localPagesMap = {};
        const localComponentsMap = {};
        const mpxPluginContext = (0, plugin_proxy_1.proxyPluginContext)(pluginContext);
        let tabBarMap = {};
        const { emitWarning, processPage, processComponent } = (0, json_helper_1.default)({
            pluginContext,
            options,
            mode
        });
        const processTabBar = (tabBar) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (tabBar) {
                tabBarMap = {};
                (_a = tabBar === null || tabBar === void 0 ? void 0 : tabBar.list) === null || _a === void 0 ? void 0 : _a.forEach(({ pagePath }) => {
                    tabBarMap[pagePath] = true;
                });
            }
        });
        const pageKeySet = new Set();
        const processPages = (pages = [], importer, tarRoot = '') => __awaiter(this, void 0, void 0, function* () {
            var _b;
            const context = mode === 'vite' ? (0, resolveModuleContext_1.default)(importer) : importer;
            for (const page of pages) {
                const pageModule = yield processPage(page, context, tarRoot);
                if (pageModule) {
                    const { key, resource } = pageModule;
                    let { outputPath } = pageModule;
                    if (!pageKeySet.has(key)) {
                        pageKeySet.add(key);
                        const { resourcePath, queryObj } = (0, compile_utils_1.parseRequest)(resource);
                        if (localPagesMap[outputPath]) {
                            const oldResource = ((_b = localPagesMap[outputPath]) === null || _b === void 0 ? void 0 : _b.resource) || '';
                            const { resourcePath: oldResourcePath } = (0, compile_utils_1.parseRequest)(oldResource);
                            if (oldResourcePath !== resourcePath) {
                                const oldOutputPath = outputPath;
                                outputPath = (0, get_output_path_1.default)(resourcePath, 'page', options, {
                                    conflictPath: outputPath
                                });
                                emitWarning(`Current page [${resourcePath}] is registered with a conflict outputPath [${oldOutputPath}] which is already existed in system, will be renamed with [${outputPath}], use ?resolve to get the real outputPath!`);
                            }
                        }
                        mpx && (mpx.pagesMap[resourcePath] = outputPath);
                        if (mode === 'webpack') {
                            pluginContext._module &&
                                pluginContext._module.addPresentationalDependency(new RecordResourceMapDependency_1.default(resourcePath, 'page', outputPath, ''));
                        }
                        // todo 确认是不是 vite 可以不用
                        // mpx.pagesEntryMap[resourcePath] = importer
                        localPagesMap[outputPath] = {
                            resource,
                            async: !!(queryObj.async) || !!(tarRoot)
                        };
                    }
                }
            }
        });
        const processComponents = (components, context) => __awaiter(this, void 0, void 0, function* () {
            if (components) {
                for (const key in components) {
                    const componentModule = yield processComponent(components[key], context, {});
                    if (componentModule) {
                        const { resource, outputPath } = componentModule;
                        const { resourcePath, queryObj } = (0, compile_utils_1.parseRequest)(resource);
                        if (mode === 'webpack') {
                            pluginContext._module &&
                                pluginContext._module.addPresentationalDependency(new RecordResourceMapDependency_1.default(resourcePath, 'component', outputPath, ''));
                            mpx && (mpx.componentsMap['main'][resourcePath] = outputPath);
                        }
                        else {
                            mpx && (mpx.componentsMap[resourcePath] = outputPath);
                        }
                        localComponentsMap[key] = {
                            resource: (0, compile_utils_1.addQuery)(resource, {
                                isComponent: true,
                                outputPath
                            }),
                            async: !!(queryObj.async)
                        };
                    }
                }
            }
        });
        const processGenerics = (generics = {}, context) => __awaiter(this, void 0, void 0, function* () {
            if (generics) {
                const genericsComponents = {};
                Object.keys(generics).forEach(name => {
                    const generic = generics[name];
                    if (generic.default)
                        genericsComponents[`${name}default`] = generic.default;
                });
                yield processComponents(genericsComponents, context);
            }
        });
        const processPackages = (packages = [], context) => __awaiter(this, void 0, void 0, function* () {
            if (packages) {
                for (const packagePath of packages) {
                    const { queryObj } = (0, compile_utils_1.parseRequest)(packagePath);
                    const packageModule = yield mpxPluginContext.resolve(packagePath, context);
                    if (!packageModule || !packageModule.id)
                        return;
                    const resource = packageModule.id;
                    const { rawResourcePath } = (0, compile_utils_1.parseRequest)(resource);
                    const code = yield fs_1.default.promises.readFile(rawResourcePath, 'utf-8');
                    const extName = (0, path_1.extname)(rawResourcePath);
                    if (extName === '.mpx') {
                        const processSelfQueue = [];
                        let jsonConfig;
                        let context = '';
                        if (mode === 'webpack') {
                            context = (0, path_1.dirname)(rawResourcePath);
                            const parts = (0, parser_1.default)(code, {
                                filePath: rawResourcePath,
                                needMap: pluginContext.sourceMap,
                                mode: options.mode,
                                env: options.env
                            });
                            jsonConfig = yield (0, resolve_json_content_1.default)(parts, pluginContext.context, pluginContext, options, pluginContext._compilation.inputFileSystem);
                        }
                        else {
                            context = resource;
                            const descriptor = (0, descriptorCache_1.createDescriptor)(resource, code, queryObj, options);
                            jsonConfig = descriptor.jsonConfig = yield (0, resolve_json_content_1.default)(descriptor, descriptor.filename, pluginContext, options);
                            pluginContext.addWatchFile(resource);
                        }
                        const { pages, packages } = jsonConfig;
                        if (pages) {
                            processSelfQueue.push(processPages(pages, context, queryObj.root));
                        }
                        if (packages) {
                            processSelfQueue.push(processPackages(packages, context));
                        }
                        if (processSelfQueue.length) {
                            yield Promise.all(processSelfQueue);
                        }
                    }
                }
            }
        });
        const processSubPackages = (subPackages = [], context) => __awaiter(this, void 0, void 0, function* () {
            for (const subPackage of subPackages) {
                processSubPackage(subPackage, context);
            }
        });
        const processSubPackage = (subPackage, context) => __awaiter(this, void 0, void 0, function* () {
            if (subPackage) {
                if (typeof subPackage.root === 'string' &&
                    subPackage.root.startsWith('.')) {
                    mpxPluginContext.error(`Current subpackage root [${subPackage.root}] is not allow starts with '.'`);
                    return `Current subpackage root [${subPackage.root}] is not allow starts with '.'`;
                }
                if (subPackage.root) {
                    if (mode === 'webpack') {
                        context = (0, path_1.join)(context, subPackage.root);
                    }
                    processPages(subPackage.pages, context, subPackage.root);
                }
            }
        });
        yield Promise.all([
            processPages(jsonConfig.pages, context),
            processPackages(jsonConfig.packages, context),
            processSubPackages(jsonConfig.subpackages, context),
            processComponents(jsonConfig.usingComponents, context),
            processGenerics(jsonConfig.componentGenerics, context),
            processTabBar(jsonConfig.tabBar)
        ]);
        return {
            jsonConfig,
            localPagesMap,
            localComponentsMap,
            tabBarMap
        };
    });
};
exports.jsonCompiler = jsonCompiler;
//# sourceMappingURL=json-compiler.js.map