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
const compile_utils_1 = require("@mpxjs/compile-utils");
const mpx_1 = __importStar(require("../mpx"));
const template_compiler_1 = __importDefault(require("../../transfrom/template-compiler"));
function default_1(template, { loaderContext, moduleId, ctorType, jsonConfig }, callback) {
    const { resourcePath } = (0, compile_utils_1.parseRequest)(loaderContext.resource);
    let builtInComponentsMap = {};
    let wxsModuleMap;
    let genericsInfo;
    let templateContent;
    let wxsContentMap;
    let output = '/* template */\n';
    const app = ctorType === 'app';
    if (app) {
        template = {
            type: 'template',
            attrs: {},
            tag: 'template',
            content: '<div class="app"><mpx-keep-alive><router-view class="page"></router-view></mpx-keep-alive></div>'
        };
    }
    if (template) {
        // 由于远端src template资源引用的相对路径可能发生变化，暂时不支持。
        if (template.src) {
            return callback(new Error('[mpx loader][' +
                loaderContext.resource +
                ']: ' +
                'template content must be inline in .mpx files!'));
        }
        if (template.lang) {
            return callback(new Error('[mpx loader][' +
                loaderContext.resource +
                ']: ' +
                'template lang is not supported in trans web mode temporarily, we will support it in the future!'));
        }
        ({
            wxsModuleMap,
            genericsInfo,
            builtInComponentsMap,
            templateContent,
            wxsContentMap
        } = (0, template_compiler_1.default)({
            template,
            options: (0, mpx_1.getOptions)(),
            pluginContext: loaderContext,
            jsonConfig,
            app,
            resource: resourcePath,
            moduleId
        }));
        Object.assign(mpx_1.default.wxsContentMap, wxsContentMap);
        template.content = templateContent;
        output += `${(0, compile_utils_1.genComponentTag)(template)}\n\n`;
    }
    callback(null, {
        output,
        builtInComponentsMap,
        genericsInfo,
        wxsModuleMap
    });
}
exports.default = default_1;
//# sourceMappingURL=processTemplate.js.map