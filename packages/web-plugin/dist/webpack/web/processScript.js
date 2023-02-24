"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loader_utils_1 = require("loader-utils");
const compile_utils_1 = require("@mpxjs/compile-utils");
const stringify_1 = __importStar(require("../../utils/stringify"));
const mpx_1 = __importStar(require("../mpx"));
const plugin_proxy_1 = require("@mpxjs/plugin-proxy");
const genCode_1 = require("../../utils/genCode");
const magic_string_1 = __importDefault(require("magic-string"));
const optionProcessorPath = '@mpxjs/web-plugin/src/runtime/optionProcessor';
const tabBarContainerPath = '@mpxjs/web-plugin/src/runtime/components/web/mpx-tab-bar-container.vue';
const tabBarPath = '@mpxjs/web-plugin/src/runtime/components/web/mpx-tab-bar.vue';
function getAsyncChunkName(chunkName) {
    if (chunkName && typeof chunkName !== 'boolean') {
        return `/* webpackChunkName: "${chunkName}" */`;
    }
    return '';
}
function default_1(script, { loaderContext, ctorType, moduleId, componentGenerics, jsonConfig, outputPath, tabBarMap, builtInComponentsMap, genericsInfo, wxsModuleMap, localComponentsMap, localPagesMap }, callback) {
    const { i18n, projectRoot, webConfig = {}, appInfo, srcMode, minimize } = mpx_1.default;
    const mpxPluginContext = (0, plugin_proxy_1.proxyPluginContext)(loaderContext);
    const { getRequire } = (0, compile_utils_1.createHelpers)(loaderContext);
    const tabBar = jsonConfig.tabBar;
    const tabBarPagesMap = {};
    const isProduction = minimize || process.env.NODE_ENV === 'production';
    const stringifyRequest = (r) => (0, loader_utils_1.stringifyRequest)(loaderContext, r);
    const genComponentCode = (resource, { async = false } = {}, params = {}) => {
        const resourceRequest = stringifyRequest(resource);
        if (!async) {
            return `getComponent(require(${resourceRequest}), ${(0, stringify_1.default)(params)})`;
        }
        else {
            return `()=>import(${getAsyncChunkName(async)}${resourceRequest}).then(res => getComponent(res, ${(0, stringify_1.default)(params)}))`;
        }
    };
    if (tabBar && tabBarMap) {
        // 挂载tabBar组件
        const tabBarRequest = (0, compile_utils_1.addQuery)(tabBar.custom ? './custom-tab-bar/index' : tabBarPath, { isComponent: true });
        tabBarPagesMap['mpx-tab-bar'] = genComponentCode(tabBarRequest);
        // 挂载tabBar页面
        Object.keys(tabBarMap).forEach(pagePath => {
            const pageCfg = localPagesMap[pagePath];
            const { resource, async } = pageCfg;
            if (pageCfg) {
                tabBarPagesMap[pagePath] = genComponentCode(resource, { async }, { __mpxPageRoute: JSON.stringify(pagePath) });
            }
            else {
                mpxPluginContext.warn(new Error(`[script processor][${loaderContext.resource}]: TabBar page path ${pagePath} is not exist in local page map, please check!`));
            }
        });
    }
    let output = '/* script */\n';
    let scriptSrcMode = srcMode;
    if (script) {
        scriptSrcMode = script.mode || scriptSrcMode;
    }
    else {
        script = {
            tag: 'script',
            type: 'script',
            content: '',
            attrs: {},
            start: 0,
            end: 0
        };
    }
    // @ts-ignore
    output += (0, compile_utils_1.genComponentTag)(script, {
        attrs(script) {
            const attrs = Object.assign({}, script.attrs);
            // src改为内联require，删除
            delete attrs.src;
            // script setup通过mpx处理，删除该属性避免vue报错
            delete attrs.setup;
            return attrs;
        },
        content: function (script) {
            const content = new magic_string_1.default(`\n  import processOption, { getComponent, getWxsMixin } from ${stringifyRequest(optionProcessorPath)}\n`);
            // add import
            if (ctorType === 'app') {
                content.append(`${(0, genCode_1.genImport)('@mpxjs/web-plugin/src/runtime/base.styl')}
          ${(0, genCode_1.genImport)('vue', 'Vue')}
          ${(0, genCode_1.genImport)('vue-router', 'VueRouter')}
           ${(0, genCode_1.genImport)('@mpxjs/core', 'Mpx')}
          Vue.use(VueRouter)
          global.getApp = function(){}
          global.getCurrentPages = function(){
            if(!global.__mpxRouter) return []
            // @ts-ignore
            return global.__mpxRouter.stack.map(item => {
            let page
            const vnode = item.vnode
            if(vnode && vnode.componentInstance) {
              page = vnode.tag.endsWith('mpx-tab-bar-container') ? vnode.componentInstance.$refs.tabBarPage : vnode.componentInstance
            }
            return page || { route: item.path.slice(1) }
          })
        }
        global.__networkTimeout = ${JSON.stringify(jsonConfig.networkTimeout)}
        global.__mpxGenericsMap = {}
        global.__mpxOptionsMap = {}
        global.__style = ${JSON.stringify(jsonConfig.style || 'v1')}
        global.__mpxPageConfig = ${JSON.stringify(jsonConfig.window)}
        global.__mpxTransRpxFn = ${webConfig.transRpxFn}\n`);
                if (i18n) {
                    const i18nObj = Object.assign({}, i18n);
                    content.append(`${(0, genCode_1.genImport)('vue-i18n', 'VueI18n')}
            import { createI18n } from 'vue-i18n-bridge'
            Vue.use(VueI18n , { bridge: true })\n
            `);
                    const requestObj = {};
                    const i18nKeys = ['messages', 'dateTimeFormats', 'numberFormats'];
                    i18nKeys.forEach(key => {
                        const i18nKey = `${key}Path`;
                        if (i18nObj[i18nKey]) {
                            requestObj[key] = stringifyRequest(i18nObj[i18nKey]);
                            delete i18nObj[i18nKey];
                        }
                    });
                    content.append(`  const i18nCfg = ${JSON.stringify(i18nObj)}\n`);
                    Object.keys(requestObj).forEach(key => {
                        content.append(`  i18nCfg.${key} = require(${requestObj[key]})\n`);
                    });
                    content.append(`   i18nCfg.legacy = false\n`);
                    content.append(`   const i18n = createI18n(i18nCfg, VueI18n)
            Vue.use(i18n)
            Mpx.i18n = i18n
            \n`);
                }
            }
            let hasApp = true;
            if (!appInfo || !appInfo.name) {
                hasApp = false;
            }
            // 注入wxs模块
            content.append('  const wxsModules = {}\n');
            if (wxsModuleMap) {
                Object.keys(wxsModuleMap).forEach(module => {
                    const src = (0, loader_utils_1.urlToRequest)(wxsModuleMap[module], projectRoot);
                    content.append(`  wxsModules.${module} = require(${stringifyRequest(src)})\n`);
                });
            }
            const pagesMap = {};
            const componentsMap = {};
            Object.keys(localPagesMap).forEach(pagePath => {
                const pageCfg = localPagesMap[pagePath];
                const { resource, async } = pageCfg;
                const isTabBar = tabBarMap && tabBarMap[pagePath];
                pagesMap[pagePath] = genComponentCode(isTabBar ? tabBarContainerPath : resource, {
                    async: isTabBar ? false : async
                }, isTabBar
                    ? { __mpxBuiltIn: true }
                    : { __mpxPageRoute: JSON.stringify(pagePath) });
            });
            Object.keys(localComponentsMap).forEach(componentName => {
                const componentCfg = localComponentsMap[componentName];
                const { resource, async } = componentCfg;
                componentsMap[componentName] = genComponentCode(resource, { async });
            });
            Object.keys(builtInComponentsMap).forEach(componentName => {
                const componentCfg = builtInComponentsMap[componentName];
                componentsMap[componentName] = genComponentCode(componentCfg.resource, { async: false }, { __mpxBuiltIn: true });
            });
            content.append(`  global.currentModuleId = ${JSON.stringify(moduleId)}\n
           global.currentSrcMode = ${JSON.stringify(scriptSrcMode)}\n
        `);
            if (!isProduction) {
                content.append(`  global.currentResource = ${JSON.stringify(loaderContext.resourcePath)}\n`);
            }
            content.append('  /** script content **/\n');
            // 传递ctorType以补全js内容
            const extraOptions = { ctorType };
            // todo 仅靠vueContentCache保障模块唯一性还是不够严谨，后续需要考虑去除原始query后构建request
            // createApp/Page/Component执行完成后立刻获取当前的option并暂存
            content.append(`  ${getRequire('script', script, extraOptions)}\n
        const currentOption = global.__mpxOptionsMap[${JSON.stringify(moduleId)}]\n
        `);
            // 获取pageConfig
            const pageConfig = {};
            if (ctorType === 'page') {
                const uselessOptions = new Set([
                    'usingComponents',
                    'style',
                    'singlePage'
                ]);
                Object.keys(jsonConfig)
                    .filter(key => !uselessOptions.has(key))
                    .forEach(key => {
                    // @ts-ignore
                    pageConfig[key] = jsonConfig[key];
                });
            }
            // 为了执行顺序正确，tabBarPagesMap在app逻辑执行完成后注入，保障小程序中app->page->component的js执行顺序
            let tabBarStr = (0, stringify_1.default)(jsonConfig.tabBar);
            if (tabBarStr && tabBarPagesMap) {
                tabBarStr = tabBarStr.replace(/"(iconPath|selectedIconPath)":"([^"]+)"/g, function (matched, $1, $2) {
                    // vite 引用本地路径无法识别
                    if ((0, compile_utils_1.isUrlRequest)($2, projectRoot, (0, mpx_1.getOptions)().externals)) {
                        return `"${$1}":require(${stringifyRequest((0, loader_utils_1.urlToRequest)($2, projectRoot))})`;
                    }
                    return matched;
                });
                content.append(`  global.__tabBar = ${tabBarStr}
             Vue.observable(global.__tabBar)
             // @ts-ignore
            global.__tabBarPagesMap = ${(0, stringify_1.shallowStringify)(tabBarPagesMap)}\n
          `);
            }
            // 配置平台转换通过createFactory在core中convertor中定义和进行
            // 通过processOption进行组件注册和路由注入
            content.append(`  export default processOption({
        option: currentOption,
        ctorType: ${JSON.stringify(ctorType)},
        firstPage: ${JSON.stringify(Object.keys(localPagesMap)[0])},
        outputPath: ${JSON.stringify(outputPath)},
        pageConfig: ${JSON.stringify(pageConfig)},
        // @ts-ignore
        pagesMap: ${(0, stringify_1.shallowStringify)(pagesMap)},
        // @ts-ignore
        componentsMap: ${(0, stringify_1.shallowStringify)(componentsMap)},
        tabBarMap: ${JSON.stringify(tabBarMap)},
        componentGenerics: ${JSON.stringify(componentGenerics)},
        genericsInfo: ${JSON.stringify(genericsInfo)},
        mixin: getWxsMixin(wxsModules),
        hasApp: ${hasApp}
        ${ctorType === 'app' ? `,Vue, VueRouter` : ''}
      })`);
            return content.toString();
        }
    });
    output += '\n';
    callback(null, {
        output
    });
}
exports.default = default_1;
//# sourceMappingURL=processScript.js.map