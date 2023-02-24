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
exports.genScriptBlock = exports.transformScript = exports.genComponentCode = void 0;
const compile_utils_1 = require("@mpxjs/compile-utils");
const magic_string_1 = __importDefault(require("magic-string"));
const vite_1 = require("vite");
const constants_1 = require("../../constants");
const genCode_1 = require("../../utils/genCode");
const omit_1 = __importDefault(require("../../utils/omit"));
const stringify_1 = __importStar(require("../../utils/stringify"));
const descriptorCache_1 = require("../utils/descriptorCache");
const helper_1 = require("../helper");
const config_1 = require("../config");
const genComponentCode = (varName, resource, { async = false } = {}, params = {}) => {
    if (!async) {
        return `getComponent(${varName}, ${(0, stringify_1.default)(params)})`;
    }
    else {
        return `() => import(${(0, stringify_1.default)(resource)}).then(${varName} =>
          getComponent(${varName}.default, ${(0, stringify_1.default)(params)})
        )`;
    }
};
exports.genComponentCode = genComponentCode;
/**
 * transform mpx script
 * @param code - mpx script content
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 * @returns script content
 */
function transformScript(descriptor, options, pluginContext) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id: componentId, filename, app, isPage, jsonConfig, script, wxsModuleMap, wxsContentMap, tabBarMap, builtInComponentsMap, genericsInfo, localPagesMap, localComponentsMap } = descriptor;
        if (!(script === null || script === void 0 ? void 0 : script.content)) {
            return {
                code: ''
            };
        }
        const s = new magic_string_1.default(script.content);
        const ctorType = app ? 'app' : isPage ? 'page' : 'component';
        const { i18n } = options;
        const componentGenerics = jsonConfig.componentGenerics;
        const pagesMap = {};
        const componentsMap = {};
        if (script.src) {
            s.prepend(`${(0, genCode_1.genImport)(script.src)}\n`);
            const resolvedId = yield pluginContext.resolve(script.src, filename);
            if (resolvedId === null || resolvedId === void 0 ? void 0 : resolvedId.id)
                (0, descriptorCache_1.setDescriptor)(resolvedId.id, descriptor);
        }
        !config_1.resolvedConfig.isProduction &&
            s.prepend(`global.currentResource = ${(0, stringify_1.default)(filename)}\n`);
        s.prepend(`global.currentModuleId = ${(0, stringify_1.default)(descriptor.id)}\n`);
        // import page by page json config
        Object.keys(localPagesMap).forEach((pageName, index) => {
            const pageCfg = localPagesMap[pageName];
            const varName = `__mpx__page__${index}`;
            const isTabBar = tabBarMap && tabBarMap[pageName];
            const newPagePath = isTabBar ? constants_1.TAB_BAR_CONTAINER_PATH : pageCfg.resource;
            const async = pageCfg.async;
            !async && s.prepend(`${(0, genCode_1.genImport)(newPagePath, varName)}\n`);
            pagesMap[pageName] = (0, exports.genComponentCode)(varName, newPagePath, {
                async
            }, isTabBar
                ? { __mpxBuiltIn: true }
                : {
                    __mpxPageRoute: pageName
                });
        });
        // import component by component json config
        Object.keys(localComponentsMap).forEach((componentName, index) => {
            const componentCfg = localComponentsMap[componentName];
            const componentId = componentCfg.resource;
            const varName = `__mpx__component__${index}`;
            const async = componentCfg.async;
            !async && s.prepend(`${(0, genCode_1.genImport)(componentId, varName)}\n`);
            componentsMap[componentName] = (0, exports.genComponentCode)(varName, componentId, {
                async
            });
        });
        // import runtime component
        Object.keys(builtInComponentsMap).forEach((componentName, index) => {
            const componentCfg = builtInComponentsMap[componentName];
            const varName = `__mpx__builtInComponent__${index}`;
            s.prepend(`${(0, genCode_1.genImport)(componentCfg.resource, varName)}\n`);
            componentsMap[componentName] = (0, exports.genComponentCode)(varName, componentCfg.resource, {}, { __mpxBuiltIn: true });
        });
        s.prepend(`${(0, genCode_1.genImport)(constants_1.OPTION_PROCESSOR_PATH, 'processOption, { getComponent, getWxsMixin }')}\n`);
        if (i18n) {
            s.prepend(`${(0, genCode_1.genImport)(helper_1.I18N_HELPER_CODE, '')}\n`);
        }
        if (app) {
            s.prepend(`${(0, genCode_1.genImport)(helper_1.APP_HELPER_CODE)}
  ${(0, genCode_1.genImport)(helper_1.TAB_BAR_PAGE_HELPER_CODE)}
  ${(0, genCode_1.genImport)('vue', 'Vue')}
  ${(0, genCode_1.genImport)('vue-router', 'VueRouter')}\n`);
        }
        // after source code
        s.append(`\nconst wxsModules = {}\n`);
        if (wxsModuleMap) {
            const wxsModuleKeys = Object.keys(wxsModuleMap);
            for (let i = 0; i < wxsModuleKeys.length; i++) {
                const key = wxsModuleKeys[i];
                const wxsModuleId = wxsModuleMap[key];
                // inline wxs module, transform to iife
                if (wxsModuleId.startsWith('~')) {
                    const mpxWxsPath = wxsModuleId.split('!=!')[1];
                    const { resourcePath: filename, queryObj: query } = (0, compile_utils_1.parseRequest)(mpxWxsPath);
                    const wxsContent = wxsContentMap[`${filename}~${query.wxsModule}`];
                    if (wxsContent) {
                        const varName = `__mpx__wxs__${i}`;
                        const result = yield (0, vite_1.transformWithEsbuild)(wxsContent, '', {
                            globalName: varName,
                            format: 'iife'
                        });
                        s.append(`${result.code}\n`);
                        s.append(`wxsModules.${key} = ${varName}\n`);
                    }
                }
                else {
                    // wxs file, tranfrom to esm with wxsPlugin
                    const varName = `__mpx__wxs__${i}`;
                    s.append(`${(0, genCode_1.genImport)(wxsModuleId, varName)}\n`);
                    s.append(`wxsModules.${key} = ${varName}\n`);
                }
            }
        }
        s.append(`const currentOption = global.__mpxOptionsMap[${(0, stringify_1.default)(descriptor.id)}]\n`);
        s.append(`export default processOption({
      option: currentOption,
      ctorType: ${(0, stringify_1.default)(ctorType)},
      firstPage: ${(0, stringify_1.default)(Object.keys(localPagesMap)[0])},
      outputPath: ${(0, stringify_1.default)(componentId)},
      pageConfig: ${(0, stringify_1.default)(isPage
            ? (0, omit_1.default)(jsonConfig, ['usingComponents', 'style', 'singlePage'])
            : {})},
      pagesMap: ${(0, stringify_1.shallowStringify)(pagesMap)},
      componentsMap: ${(0, stringify_1.shallowStringify)(componentsMap)},
      tabBarMap: ${(0, stringify_1.default)(tabBarMap)},
      componentGenerics: ${(0, stringify_1.default)(componentGenerics)},
      genericsInfo: ${(0, stringify_1.default)(genericsInfo)},
      mixin: getWxsMixin(wxsModules),
      ...${app ? `{ Vue: Vue, VueRouter: VueRouter }` : '{}'}
   })\n`);
        // transform ts
        if ((script === null || script === void 0 ? void 0 : script.attrs.lang) === 'ts' && !script.src) {
            const result = (0, vite_1.transformWithEsbuild)(s.toString(), filename, { loader: 'ts' }, s.generateMap({
                file: filename + '.map',
                source: filename
            }));
            return result;
        }
        return {
            code: s.toString(),
            map: s.generateMap({
                file: filename + '.map',
                source: filename
            })
        };
    });
}
exports.transformScript = transformScript;
/**
 * generate script block and transform script content
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
function genScriptBlock(descriptor, code) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            output: (0, compile_utils_1.genComponentTag)(descriptor.script, {
                attrs() {
                    return {};
                },
                content() {
                    return code;
                }
            })
        };
    });
}
exports.genScriptBlock = genScriptBlock;
//# sourceMappingURL=script.js.map