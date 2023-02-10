"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const parser_1 = __importDefault(require("@mpxjs/compiler/template-compiler/parser"));
const compile_utils_1 = require("@mpxjs/compile-utils");
const selector = function (content) {
    this.cacheable();
    // 兼容处理处理ts-loader中watch-run/updateFile逻辑，直接跳过当前loader及后续的loader返回内容
    const pathExtname = path_1.default.extname(this.resourcePath);
    if (!['.vue', '.mpx'].includes(pathExtname)) {
        this.loaderIndex = (0, compile_utils_1.tsWatchRunLoaderFilter)(this.loaders, this.loaderIndex);
        return content;
    }
    // 移除mpx访问依赖，支持 thread-loader
    const { mode, env } = this.getOptions() || {};
    if (!mode && !env) {
        return content;
    }
    const { queryObj } = (0, compile_utils_1.parseRequest)(this.resource);
    const ctorType = queryObj.ctorType;
    const type = queryObj.type;
    const index = queryObj.index || 0;
    const filePath = this.resourcePath;
    const parts = (0, parser_1.default)(content, {
        filePath,
        needMap: this.sourceMap,
        mode,
        env
    });
    let part = parts[type];
    if (Array.isArray(part)) {
        part = part[index];
    }
    if (!part) {
        let content = '';
        // 补全js内容
        if (type === 'script') {
            switch (ctorType) {
                case 'app':
                    content +=
                        'import {createApp} from "@mpxjs/core"\n' + 'createApp({})\n';
                    break;
                case 'page':
                    content +=
                        'import {createPage} from "@mpxjs/core"\n' + 'createPage({})\n';
                    break;
                case 'component':
                    content +=
                        'import {createComponent} from "@mpxjs/core"\n' +
                            'createComponent({})\n';
            }
        }
        part = { content };
    }
    part = part || { content: '' };
    this.callback(null, part.content, part.map);
};
exports.default = selector;
//# sourceMappingURL=selector.js.map