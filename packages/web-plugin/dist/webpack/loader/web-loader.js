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
const parser_1 = __importDefault(require("@mpxjs/compiler/template-compiler/parser"));
const compile_utils_1 = require("@mpxjs/compile-utils");
const RecordResourceMapDependency_1 = __importDefault(require("@mpxjs/webpack-plugin/lib/dependencies/RecordResourceMapDependency"));
const RecordVueContentDependency_1 = __importDefault(require("@mpxjs/webpack-plugin/lib/dependencies/RecordVueContentDependency"));
const async_1 = __importDefault(require("async"));
const loader_utils_1 = __importDefault(require("loader-utils"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../../constants");
const mpx_1 = __importStar(require("../mpx"));
const processJSON_1 = __importDefault(require("../web/processJSON"));
const processScript_1 = __importDefault(require("../web/processScript"));
const processStyles_1 = __importDefault(require("../web/processStyles"));
const processTemplate_1 = __importDefault(require("../web/processTemplate"));
const pageHash_1 = __importDefault(require("../../utils/pageHash"));
const compile_utils_2 = require("@mpxjs/compile-utils");
const get_output_path_1 = __importDefault(require("../../utils/get-output-path"));
const resolve_json_content_1 = __importDefault(require("../../utils/resolve-json-content"));
function default_1(content) {
    var _a, _b, _c;
    this.cacheable();
    // 兼容处理处理ts-loader中watch-run/updateFile逻辑，直接跳过当前loader及后续的loader返回内容
    const pathExtname = path_1.default.extname(this.resourcePath);
    if (!['.vue', '.mpx'].includes(pathExtname)) {
        this.loaderIndex = (0, compile_utils_2.tsWatchRunLoaderFilter)(this.loaders, this.loaderIndex);
        return content;
    }
    if (!mpx_1.default) {
        return content;
    }
    const { resourcePath, queryObj } = (0, compile_utils_1.parseRequest)(this.resource);
    const packageRoot = queryObj.packageRoot || mpx_1.default.currentPackageRoot;
    const packageName = packageRoot || 'main';
    const pagesMap = mpx_1.default.pagesMap;
    const componentsMap = mpx_1.default.componentsMap[packageName];
    const mode = mpx_1.default.mode;
    const env = mpx_1.default.env;
    const autoScope = (0, compile_utils_1.matchCondition)(resourcePath, mpx_1.default.autoScopeRules);
    let ctorType = 'app';
    if (pagesMap[resourcePath]) {
        // page
        ctorType = 'page';
    }
    else if (componentsMap[resourcePath]) {
        // component
        ctorType = 'component';
    }
    // 支持资源query传入isPage或isComponent支持页面/组件单独编译
    if (ctorType === 'app' && (queryObj.isComponent || queryObj.isPage)) {
        const entryName = (0, compile_utils_1.getEntryName)(this) ||
            (0, get_output_path_1.default)(resourcePath, queryObj.isComponent ? 'component' : 'page', mpx_1.default) ||
            '';
        ctorType = queryObj.isComponent ? 'component' : 'page';
        (_a = this._module) === null || _a === void 0 ? void 0 : _a.addPresentationalDependency((new RecordResourceMapDependency_1.default(resourcePath, ctorType, entryName, packageRoot)));
    }
    if (ctorType === 'app') {
        if (!((_b = mpx_1.default.appInfo) === null || _b === void 0 ? void 0 : _b.name)) {
            mpx_1.default.appInfo = {
                resourcePath,
                name: (0, compile_utils_1.getEntryName)(this)
            };
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const loaderContext = this;
    const stringifyRequest = (r) => loader_utils_1.default.stringifyRequest(loaderContext, r);
    const filePath = this.resourcePath;
    const moduleId = ctorType === 'app'
        ? constants_1.MPX_APP_MODULE_ID
        : 'm' + ((pageHash_1.default && (0, pageHash_1.default)(filePath)) || '');
    // 将mpx文件 分成四部分
    const parts = (0, parser_1.default)(content, {
        filePath,
        needMap: this.sourceMap,
        mode,
        env
    });
    let output = '';
    const callback = this.async();
    (0, resolve_json_content_1.default)(parts, loaderContext.context, loaderContext, (0, mpx_1.getOptions)(), (_c = loaderContext._compilation) === null || _c === void 0 ? void 0 : _c.inputFileSystem).then(jsonConfig => {
        let componentGenerics = {};
        if (jsonConfig.componentGenerics) {
            componentGenerics = Object.assign({}, jsonConfig.componentGenerics);
        }
        // 处理mode为web时输出vue格式文件
        if (ctorType === 'app' && !queryObj.isApp) {
            const request = (0, compile_utils_1.addQuery)(this.resource, { isApp: true });
            const el = (mpx_1.default.webConfig && mpx_1.default.webConfig.el) || '#app';
            output += `
import App from ${stringifyRequest(request)}
import Vue from 'vue'
new Vue({
  el: '${el}',
  render: function(h){
    return h(App)
  }
})\n
`;
            // 直接结束loader进入parse
            this.loaderIndex = -1;
            return callback(null, output);
        }
        // 通过RecordVueContentDependency和vueContentCache确保子request不再重复生成vueContent
        const cacheContent = mpx_1.default.vueContentCache && mpx_1.default.vueContentCache.get(filePath);
        if (cacheContent)
            return callback(null, cacheContent);
        return async_1.default.waterfall([
            (callback) => {
                async_1.default.parallel([
                    callback => {
                        (0, processTemplate_1.default)(parts.template, {
                            loaderContext,
                            moduleId,
                            ctorType,
                            jsonConfig
                        }, callback);
                    },
                    callback => {
                        (0, processStyles_1.default)(parts.styles, {
                            ctorType,
                            autoScope,
                            moduleId
                        }, callback);
                    },
                    callback => {
                        (0, processJSON_1.default)(jsonConfig, {
                            loaderContext
                        }, callback);
                    }
                ], (err, res) => {
                    callback(err, res);
                });
            },
            ([templateRes, stylesRes, jsonRes], callback) => {
                output += templateRes.output;
                output += stylesRes.output;
                output += jsonRes.output;
                if (ctorType === 'app' &&
                    jsonRes.jsonConfig.window &&
                    jsonRes.jsonConfig.window.navigationBarTitleText) {
                    mpx_1.default.appTitle = jsonRes.jsonConfig.window.navigationBarTitleText;
                }
                (0, processScript_1.default)(parts.script, {
                    loaderContext,
                    ctorType,
                    moduleId,
                    componentGenerics,
                    jsonConfig: jsonRes.jsonConfig,
                    outputPath: queryObj.outputPath || '',
                    tabBarMap: jsonRes.tabBarMap,
                    builtInComponentsMap: templateRes.builtInComponentsMap,
                    genericsInfo: templateRes.genericsInfo,
                    wxsModuleMap: templateRes.wxsModuleMap,
                    localComponentsMap: jsonRes.localComponentsMap,
                    localPagesMap: jsonRes.localPagesMap
                }, callback);
            }
        ], (err, scriptRes) => {
            if (err)
                return callback(err);
            output += scriptRes.output;
            this._module &&
                this._module.addPresentationalDependency(new RecordVueContentDependency_1.default(filePath, output));
            callback(null, output);
        });
    });
}
exports.default = default_1;
//# sourceMappingURL=web-loader.js.map