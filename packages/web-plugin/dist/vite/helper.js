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
exports.renderTabBarPageCode = exports.renderAppHelpCode = exports.renderI18nCode = exports.renderEntryCode = exports.renderPageRouteCode = exports.TAB_BAR_PAGE_HELPER_CODE = exports.I18N_HELPER_CODE = exports.APP_HELPER_CODE = exports.ENTRY_HELPER_CODE = void 0;
const constants_1 = require("../constants");
const genCode_1 = require("../utils/genCode");
const compile_utils_1 = require("@mpxjs/compile-utils");
const stringify_1 = __importStar(require("../utils/stringify"));
const mpx_1 = __importDefault(require("./mpx"));
const script_1 = require("./transformer/script");
const config_1 = require("./config");
exports.ENTRY_HELPER_CODE = '\0/vite/mpx-entry-helper';
exports.APP_HELPER_CODE = '\0/vite/mpx-app-helper';
exports.I18N_HELPER_CODE = '\0/vite/mpx-i18n-helper';
exports.TAB_BAR_PAGE_HELPER_CODE = '\0/vite/mpx-tab-bar-page-helper';
const renderPageRouteCode = (options, importer) => {
    return `export default ${(0, stringify_1.default)(config_1.resolvedConfig.base + mpx_1.default.pagesMap[importer])}`;
};
exports.renderPageRouteCode = renderPageRouteCode;
const renderEntryCode = (importer, options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    return `
    ${(0, genCode_1.genImport)((0, compile_utils_1.addQuery)(importer, { app: true }), 'App')}
    ${(0, genCode_1.genImport)('@mpxjs/web-plugin/src/runtime/base.styl')}
    ${(0, genCode_1.genImport)('vue', 'Vue')}
    ${(0, genCode_1.genImport)('vue-router', 'VueRouter')}
    ${(0, genCode_1.genImport)('@better-scroll/core', 'BScroll')}
    ${(0, genCode_1.genImport)('@better-scroll/pull-down', 'PullDown')}
    ${(0, genCode_1.genImport)('@better-scroll/observe-dom', 'ObserveDOM')}
    Vue.use(VueRouter)
    BScroll.use(ObserveDOM)
    BScroll.use(PullDown)
    global.BScroll = BScroll
    new Vue({
      el: ${((_a = options.webConfig) === null || _a === void 0 ? void 0 : _a.el) || '"#app"'},
      render: function(h){
        return h(App)
      }
    })
  `;
});
exports.renderEntryCode = renderEntryCode;
function renderI18nCode(options) {
    const content = [];
    const { i18n } = options;
    if (i18n) {
        content.push((0, genCode_1.genImport)('vue', 'Vue'), (0, genCode_1.genImport)('vue-i18n', 'VueI18n'), (0, genCode_1.genImport)(`vue-i18n-bridge`, '{ createI18n }'), (0, genCode_1.genImport)('@mpxjs/core', 'Mpx'), `Vue.use(VueI18n, { bridge: true })`);
        const i18nObj = Object.assign({}, i18n);
        const requestObj = {};
        const i18nKeys = ['messages', 'dateTimeFormats', 'numberFormats'];
        i18nKeys.forEach(key => {
            const keyPath = `${key}Path`;
            if (i18nObj[keyPath]) {
                requestObj[key] = (0, stringify_1.default)(i18nObj[keyPath]);
                delete i18nObj[keyPath];
            }
        });
        Object.keys(requestObj).forEach(key => {
            content.push(`import __mpx__i18n__${key} from ${requestObj[key]}`);
        });
        content.push(`const i18nCfg = ${(0, stringify_1.default)(i18nObj)}`);
        Object.keys(requestObj).forEach(key => {
            content.push(`i18nCfg.${key} = __mpx__i18n__${key}`);
        });
        content.push(`i18nCfg.legacy = false`, `const i18n = createI18n(i18nCfg, VueI18n)`, `Vue.use(i18n)`, `Mpx.i18n = i18n`);
    }
    return content.join('\n');
}
exports.renderI18nCode = renderI18nCode;
/**
 * app初始化代码，主要是初始化所有的global对象
 * @param descriptor - SFCDescriptor
 * @returns
 */
function renderAppHelpCode(options, descriptor, pluginContext) {
    return __awaiter(this, void 0, void 0, function* () {
        const { jsonConfig } = descriptor;
        const content = [];
        const tabBar = Object.assign({}, jsonConfig.tabBar);
        const list = tabBar.list || [];
        const newList = [];
        const needReplaceName = [];
        function resolveTabBarItemIcon(item, key) {
            return __awaiter(this, void 0, void 0, function* () {
                const iconPath = item[key];
                if (iconPath &&
                    (0, compile_utils_1.isUrlRequest)(iconPath, jsonConfig.path, options.externals)) {
                    const varName = `__mpx_icon_${needReplaceName.length}__`;
                    needReplaceName.push(varName);
                    const resolveIcon = yield pluginContext.resolve(iconPath, jsonConfig.path);
                    if (resolveIcon) {
                        item[key] = varName;
                        content.push(`import ${varName} from "${resolveIcon.id}"`);
                    }
                }
            });
        }
        for (let i = 0; i < list.length; i++) {
            const item = Object.assign({}, list[i]);
            yield resolveTabBarItemIcon(item, 'iconPath');
            yield resolveTabBarItemIcon(item, 'selectedIconPath');
            newList.push(item);
        }
        tabBar.list = newList;
        let tabBarStr = (0, stringify_1.default)(tabBar);
        needReplaceName.forEach(v => {
            tabBarStr = tabBarStr.replace(`"${v}"`, v);
        });
        content.push(`global.__networkTimeout = ${(0, stringify_1.default)(jsonConfig.networkTimeout)}`, `global.__style = ${(0, stringify_1.default)(jsonConfig.style || 'v1')}`, `global.__mpxPageConfig = ${(0, stringify_1.default)(jsonConfig.window || {})}`, `global.__tabBar = ${tabBarStr}`, `global.currentSrcMode = "${options.srcMode}"`, `global.getApp = function(){ return {} }`, `global.getCurrentPages = function(){
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
    }`, `global.__mpxGenericsMap = {}`);
        return content.join('\n');
    });
}
exports.renderAppHelpCode = renderAppHelpCode;
/**
 * TabBar，mpx-tab-bar-container依赖global.__tabBarPagesMap
 * @param options -
 * @param descriptor -
 * @param pluginContext -
 * @returns
 */
const renderTabBarPageCode = (options, descriptor, pluginContext) => __awaiter(void 0, void 0, void 0, function* () {
    const customBarPath = './custom-tab-bar/index?isComponent';
    const tabBars = [];
    const { filename, jsonConfig, tabBarMap, localPagesMap } = descriptor;
    const { tabBar } = jsonConfig;
    const tabBarPagesMap = {};
    const emitWarning = (msg) => {
        pluginContext.warn('[script processor]: ' + msg);
    };
    if (tabBar && tabBarMap) {
        const varName = '__mpxTabBar';
        let tabBarPath = constants_1.TAB_BAR_PATH;
        if (tabBar.custom) {
            const customBarPathResolved = yield pluginContext.resolve(customBarPath, filename);
            tabBarPath = (customBarPathResolved === null || customBarPathResolved === void 0 ? void 0 : customBarPathResolved.id) || constants_1.TAB_BAR_PATH;
        }
        tabBars.push((0, genCode_1.genImport)(tabBarPath, varName));
        tabBarPagesMap['mpx-tab-bar'] = (0, script_1.genComponentCode)(varName, tabBarPath);
        Object.keys(tabBarMap).forEach((tarbarName, index) => {
            const tabBarId = localPagesMap[tarbarName].resource;
            if (tabBarId) {
                const varName = `__mpx_tabBar__${index}`;
                const { queryObj: query } = (0, compile_utils_1.parseRequest)(tabBarId);
                const async = !!query.async;
                !async && tabBars.push((0, genCode_1.genImport)(tabBarId, varName));
                tabBarPagesMap[tarbarName] = (0, script_1.genComponentCode)(varName, tabBarId, {
                    async
                }, {
                    __mpxPageroute: tarbarName
                });
            }
            else {
                emitWarning(`TabBar page path ${tarbarName} is not exist in local page map, please check!`);
            }
        });
    }
    const content = [
        (0, genCode_1.genImport)('vue', 'Vue'),
        (0, genCode_1.genImport)(constants_1.OPTION_PROCESSOR_PATH, 'processOption, { getComponent }'),
        tabBars.join('\n'),
        `global.__tabBar && Vue.observable(global.__tabBar)`,
        tabBarPagesMap &&
            `// @ts-ignore
      global.__tabBarPagesMap = ${(0, stringify_1.shallowStringify)(tabBarPagesMap)}`
    ];
    return content.join('\n');
});
exports.renderTabBarPageCode = renderTabBarPageCode;
//# sourceMappingURL=helper.js.map