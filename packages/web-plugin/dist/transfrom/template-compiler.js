"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_proxy_1 = require("@mpxjs/plugin-proxy");
const compile_utils_1 = require("@mpxjs/compile-utils");
const compiler_1 = require("@mpxjs/compiler");
const calculateRootEleChild = (arr) => {
    if (!arr)
        return 0;
    return arr.reduce((total, item) => {
        if (item.type === 1) {
            if (item.tag === 'template') {
                total += calculateRootEleChild(item.children);
            }
            else {
                total += 1;
            }
        }
        return total;
    }, 0);
};
function templateTransform({ template, options, pluginContext, jsonConfig, resource, moduleId, app }) {
    var _a;
    const mpxPluginContext = (0, plugin_proxy_1.proxyPluginContext)(pluginContext);
    const { usingComponents = {}, componentGenerics = {} } = jsonConfig;
    const builtInComponentsMap = {};
    let genericsInfo;
    let wxsModuleMap = {};
    let templateContent = '';
    const { mode = 'web', srcMode, defs = {}, decodeHTMLText = false, externalClasses = [], checkUsingComponents = false } = options;
    const wxsContentMap = {};
    const addBuildComponent = (name, resource) => {
        builtInComponentsMap[name] = {
            resource: (0, compile_utils_1.addQuery)(resource, { isComponent: true })
        };
    };
    if (app) {
        addBuildComponent('mpx-keep-alive', '@mpxjs/web-plugin/src/runtime/components/web/mpx-keep-alive.vue');
        templateContent = template.content;
    }
    else {
        const { root, meta } = compiler_1.templateCompiler.parse(template.content, {
            warn: msg => {
                mpxPluginContext === null || mpxPluginContext === void 0 ? void 0 : mpxPluginContext.warn('[template compiler]: ' + msg);
            },
            error: msg => {
                mpxPluginContext === null || mpxPluginContext === void 0 ? void 0 : mpxPluginContext.error('[template compiler]: ' + msg);
            },
            usingComponents: Object.keys(usingComponents),
            hasComment: !!((_a = template === null || template === void 0 ? void 0 : template.attrs) === null || _a === void 0 ? void 0 : _a.comments),
            isNative: false,
            isComponent: !app,
            mode,
            srcMode: template.mode || srcMode,
            defs,
            decodeHTMLText,
            externalClasses,
            // todo 后续输出web也采用mpx的scoped处理
            hasScoped: false,
            moduleId,
            filePath: resource,
            i18n: null,
            checkUsingComponents,
            // web模式下全局组件不会被合入usingComponents中，故globalComponents可以传空
            globalComponents: [],
            // web模式下实现抽象组件
            componentGenerics
        });
        if (meta.builtInComponentsMap) {
            Object.entries(meta.builtInComponentsMap).forEach(([name, resource]) => addBuildComponent(name, resource));
        }
        if (meta.wxsModuleMap) {
            wxsModuleMap = meta.wxsModuleMap;
        }
        if (meta.wxsContentMap) {
            for (const module in meta.wxsContentMap) {
                wxsContentMap[`${resource}~${module}`] = meta.wxsContentMap[module];
            }
        }
        if (meta.genericsInfo) {
            genericsInfo = meta.genericsInfo;
        }
        if (root.tag === 'temp-node') {
            const childLen = calculateRootEleChild(root.children);
            if (childLen >= 2) {
                root.tag = 'div';
                compiler_1.templateCompiler.addAttrs(root, [
                    {
                        name: 'class',
                        value: 'mpx-root-view'
                    }
                ]);
            }
        }
        templateContent = compiler_1.templateCompiler.serialize(root);
    }
    return {
        templateContent,
        wxsModuleMap,
        wxsContentMap,
        genericsInfo,
        builtInComponentsMap
    };
}
exports.default = templateTransform;
//# sourceMappingURL=template-compiler.js.map