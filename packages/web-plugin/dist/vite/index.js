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
const vite_1 = require("vite");
const plugin_vue2_1 = __importDefault(require("@vitejs/plugin-vue2"));
const options_1 = require("../options");
const compile_utils_1 = require("@mpxjs/compile-utils");
const stringify_1 = require("../utils/stringify");
const handleHotUpdate_1 = __importDefault(require("./handleHotUpdate"));
const helper_1 = require("./helper");
const mpx_1 = __importDefault(require("./mpx"));
const addExtensionsPlugin_1 = require("./plugins/addExtensionsPlugin");
const resolveEntryPlugin_1 = require("./plugins/resolveEntryPlugin");
const splitPackageChunkPlugin_1 = require("./plugins/splitPackageChunkPlugin");
const wxsPlugin_1 = require("./plugins/wxsPlugin");
const main_1 = require("./transformer/main");
const style_1 = require("./transformer/style");
const descriptorCache_1 = require("./utils/descriptorCache");
const config_1 = require("./config");
const outsideJs_1 = require("./plugins/outsideJs");
function createMpxWebPlugin(options, userConfig) {
    const { include, exclude } = options;
    const filter = (0, vite_1.createFilter)(include, exclude);
    return {
        name: 'vite:mpx',
        config() {
            return Object.assign(Object.assign({}, userConfig), { define: Object.assign(Object.assign({ global: 'globalThis', 'process.env.NODE_ENV': JSON.stringify(config_1.resolvedConfig.isProduction ? '"production"' : '"development"') }, userConfig === null || userConfig === void 0 ? void 0 : userConfig.define), (0, stringify_1.stringifyObject)(options.defs)) });
        },
        configResolved(c) {
            Object.assign(config_1.resolvedConfig, {
                base: c.base,
                sourceMap: c.command === 'build' ? !!c.build.sourcemap : true,
                isProduction: c.isProduction
            });
        },
        handleHotUpdate(ctx) {
            return (0, handleHotUpdate_1.default)(ctx);
        },
        resolveId(id) {
            return __awaiter(this, void 0, void 0, function* () {
                if (id === helper_1.APP_HELPER_CODE ||
                    id === helper_1.I18N_HELPER_CODE ||
                    id === helper_1.TAB_BAR_PAGE_HELPER_CODE) {
                    return id;
                }
            });
        },
        load(id) {
            if (id === helper_1.APP_HELPER_CODE && mpx_1.default.entry) {
                const { resourcePath: filename } = (0, compile_utils_1.parseRequest)(mpx_1.default.entry);
                const descriptor = (0, descriptorCache_1.getDescriptor)(filename);
                if (descriptor) {
                    return (0, helper_1.renderAppHelpCode)(options, descriptor, this);
                }
            }
            if (id === helper_1.TAB_BAR_PAGE_HELPER_CODE && mpx_1.default.entry) {
                const { resourcePath: filename } = (0, compile_utils_1.parseRequest)(mpx_1.default.entry);
                const descriptor = (0, descriptorCache_1.getDescriptor)(filename);
                if (descriptor) {
                    return (0, helper_1.renderTabBarPageCode)(options, descriptor, this);
                }
            }
            if (id === helper_1.I18N_HELPER_CODE) {
                return (0, helper_1.renderI18nCode)(options);
            }
        },
        transform(code, id) {
            return __awaiter(this, void 0, void 0, function* () {
                const { queryObj: query, resourcePath: filename } = (0, compile_utils_1.parseRequest)(id);
                if (!filter(filename))
                    return;
                if (!!query.resolve)
                    return;
                if (query.vue === undefined) {
                    // mpx file => vue file
                    return yield (0, main_1.transformMain)(code, filename, query, options, this);
                }
                else {
                    if (query.type === 'style') {
                        // mpx style => vue style
                        const descriptor = (0, descriptorCache_1.getDescriptor)(filename);
                        if (descriptor) {
                            return yield (0, style_1.transformStyle)(code, filename, descriptor, options, this);
                        }
                    }
                    if (query.type === 'hot') {
                        // 来自于热更新的请求，转换新的代码并缓存vueSfc到descriptor
                        yield (0, main_1.transformMain)(code, filename, query, options, this);
                        return 'export default {}';
                    }
                }
            });
        }
    };
}
function mpx(options = {}) {
    const baseOptions = (0, options_1.processOptions)(Object.assign({}, options));
    const { mode = '', env = '', fileConditionRules } = baseOptions;
    const customExtensions = [mode, env, env && `${mode}.${env}`].filter(Boolean);
    const plugins = [
        // split subpackage chunk
        (0, splitPackageChunkPlugin_1.createSplitPackageChunkPlugin)(),
        // add custom extensions
        (0, addExtensionsPlugin_1.customExtensionsPlugin)({
            include: /@mpxjs|\.mpx/,
            fileConditionRules,
            extensions: customExtensions
        }),
        // ensure mpx entry point
        (0, resolveEntryPlugin_1.createResolveEntryPlugin)(baseOptions),
        // wxs => js
        (0, wxsPlugin_1.createWxsPlugin)(),
        // 外联js/ts增加globalDefine
        (0, outsideJs_1.createMpxOutSideJsPlugin)(),
        // mpx => vue
        createMpxWebPlugin(baseOptions, {
            optimizeDeps: {
                esbuildOptions: {
                    plugins: [
                        // prebuild for addExtensions
                        (0, addExtensionsPlugin_1.esbuildCustomExtensionsPlugin)({
                            include: /@mpxjs|api-proxy|core/,
                            fileConditionRules,
                            extensions: customExtensions
                        })
                    ]
                }
            }
        }),
        // vue support for mpxjs/rumtime
        (0, plugin_vue2_1.default)({
            include: /\.vue|\.mpx$/
        })
    ];
    return plugins;
}
exports.default = mpx;
//# sourceMappingURL=index.js.map