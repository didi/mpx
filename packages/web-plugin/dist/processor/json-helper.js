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
const compile_utils_1 = require("@mpxjs/compile-utils");
const plugin_proxy_1 = require("@mpxjs/plugin-proxy");
const loader_utils_1 = __importStar(require("loader-utils"));
const path_1 = __importStar(require("path"));
const get_output_path_1 = __importDefault(require("../utils/get-output-path"));
function createJSONHelper({ pluginContext, options, mode }) {
    const externals = options.externals || [];
    const root = options.projectRoot;
    const mpxPluginContext = (0, plugin_proxy_1.proxyPluginContext)(pluginContext);
    const isUrlRequest = (r) => (0, compile_utils_1.isUrlRequest)(r, root, externals);
    const urlToRequest = (r) => loader_utils_1.default.urlToRequest(r);
    const stringifyRequest = (r) => (0, loader_utils_1.stringifyRequest)(pluginContext, r);
    const emitWarning = (msg) => {
        mpxPluginContext.warn('[json processor]: ' + msg);
    };
    const processComponent = (component, context, { tarRoot = '', outputPath = '' }) => __awaiter(this, void 0, void 0, function* () {
        if (!isUrlRequest(component))
            return;
        const componentModule = yield mpxPluginContext.resolve(component, context);
        if (!componentModule || !componentModule.id)
            return;
        let resource = componentModule.id;
        const { resourcePath, queryObj } = (0, compile_utils_1.parseRequest)(resource);
        if (queryObj.root) {
            // 删除root query
            resource = (0, compile_utils_1.addQuery)(resource, {}, false, ['root']);
        }
        if (!outputPath) {
            outputPath = (0, get_output_path_1.default)(resourcePath, 'component', options) || '';
        }
        return {
            resource,
            outputPath: (0, compile_utils_1.toPosix)((0, path_1.join)(tarRoot, outputPath)),
            packageRoot: tarRoot
        };
    });
    const processPage = (page, context, tarRoot = '') => __awaiter(this, void 0, void 0, function* () {
        let aliasPath = '';
        if (typeof page !== 'string') {
            aliasPath = page.path;
            page = page.src;
        }
        if (!isUrlRequest(page))
            return;
        if (mode === 'vite') {
            page = path_1.default.resolve(context, tarRoot, page);
            context = path_1.default.join(context, tarRoot);
        }
        const pageModule = yield mpxPluginContext.resolve((0, compile_utils_1.addQuery)(page, { isPage: true }), context);
        if (!pageModule || !pageModule.id)
            return;
        const resource = pageModule.id;
        const { resourcePath } = (0, compile_utils_1.parseRequest)(resource);
        let outputPath = '';
        if (aliasPath) {
            outputPath = aliasPath.replace(/^\//, '');
        }
        else {
            const relative = path_1.default.relative(context, resourcePath);
            if (/^\./.test(relative)) {
                // 如果当前page不存在于context中，对其进行重命名
                outputPath = (0, get_output_path_1.default)(resourcePath, 'page', options) || '';
                mpxPluginContext.warn(`Current page [${resourcePath}] is not in current pages directory [${context}], the page path will be replaced with [${outputPath}], use ?resolve to get the page path and navigate to it!`);
            }
            else {
                const exec = /^(.*?)(\.[^.]*)?$/.exec(relative);
                if (exec) {
                    outputPath = exec[1];
                }
            }
        }
        const key = [resourcePath, outputPath, tarRoot].join('|');
        return {
            resource,
            outputPath: (0, compile_utils_1.toPosix)((0, path_1.join)(tarRoot, outputPath)),
            packageRoot: tarRoot,
            key
        };
    });
    return {
        stringifyRequest,
        emitWarning,
        processComponent,
        processPage,
        isUrlRequest,
        urlToRequest
    };
}
exports.default = createJSONHelper;
//# sourceMappingURL=json-helper.js.map