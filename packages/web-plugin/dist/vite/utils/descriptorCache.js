"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDescriptor = exports.getDescriptor = exports.setPrevDescriptor = exports.getPrevDescriptor = exports.createDescriptor = void 0;
const compiler_1 = require("@mpxjs/compiler");
const path_1 = __importDefault(require("path"));
const slash_1 = __importDefault(require("slash"));
const pageHash_1 = __importDefault(require("../../utils/pageHash"));
const config_1 = require("../config");
const cache = new Map();
const prevCache = new Map();
function genDescriptorTemplate() {
    const template = {
        tag: 'template',
        type: 'template',
        content: '<div class="app"><mpx-keep-alive><router-view class="page"></router-view></mpx-keep-alive></div>',
        attrs: {},
        start: 0,
        end: 0
    };
    return template;
}
function genDescriptorScript(descriptor) {
    const script = {
        tag: 'script',
        type: 'script',
        content: '',
        attrs: {},
        start: 0,
        end: 0
    };
    if (descriptor.app) {
        script.content = `
import { createApp } from "@mpxjs/core"
createApp({})`;
    }
    if (descriptor.isPage) {
        script.content = `
import { createPage } from "@mpxjs/core"
createPage({})`;
    }
    if (descriptor.isComponent) {
        script.content = `
import { createComponent } from "@mpxjs/core"
createComponent({})`;
    }
    return script;
}
function createDescriptor(filename, code, query, options) {
    const { projectRoot = '', mode = 'web', defs, env } = options;
    const { isProduction, sourceMap } = config_1.resolvedConfig;
    const normalizedPath = (0, slash_1.default)(path_1.default.normalize(path_1.default.relative(projectRoot, filename)));
    const isPage = !!query.isPage;
    const isComponent = !!query.isComponent;
    const compilerResult = compiler_1.templateCompiler.parseComponent(code, {
        mode,
        defs,
        env,
        filePath: filename,
        pad: 'line',
        needMap: sourceMap
    });
    if (compilerResult.script && compilerResult.script.map) {
        const sources = compilerResult.script.map.sources || [];
        compilerResult.script.map.sources = sources.map((v) => v.split('?')[0]);
    }
    const descriptor = Object.assign(Object.assign({}, compilerResult), { id: (0, pageHash_1.default)(normalizedPath + (isProduction ? code : '')), filename,
        isPage,
        isComponent, app: !(isPage || isComponent), wxsModuleMap: {}, wxsContentMap: {}, builtInComponentsMap: {}, genericsInfo: undefined, jsonConfig: {}, localPagesMap: {}, localComponentsMap: {}, tabBarMap: {} });
    if (descriptor.app) {
        descriptor.template = genDescriptorTemplate();
    }
    if (!descriptor.script) {
        descriptor.script = genDescriptorScript(descriptor);
    }
    setDescriptor(filename, descriptor);
    return descriptor;
}
exports.createDescriptor = createDescriptor;
function getPrevDescriptor(filename) {
    return prevCache.get(filename);
}
exports.getPrevDescriptor = getPrevDescriptor;
function setPrevDescriptor(filename, entry) {
    prevCache.set(filename, entry);
}
exports.setPrevDescriptor = setPrevDescriptor;
function getDescriptor(filename, code, query, options, createIfNotFound = true) {
    if (cache.has(filename)) {
        return cache.get(filename);
    }
    if (createIfNotFound && code && query && options) {
        return createDescriptor(filename, code, query, options);
    }
}
exports.getDescriptor = getDescriptor;
function setDescriptor(filename, entry) {
    cache.set(filename, entry);
}
exports.setDescriptor = setDescriptor;
//# sourceMappingURL=descriptorCache.js.map