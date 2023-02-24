"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tsWatchRunLoaderFilter = void 0;
const set_1 = __importDefault(require("./set"));
const selectorPath = '@mpxjs/loaders/selector.js';
const scriptSetupPath = '@mpxjs/compiler/script-setup-compiler/index.js';
const webMpxLoaderPath = '@mpxjs/web-plugin/webpack/loader/web-loader.js';
const mpxLoaderPath = '@mpxjs/webpack-plugin/lib/loader.js';
const tsLoaderWatchRunFilterLoaders = new Set([
    selectorPath,
    scriptSetupPath,
    mpxLoaderPath,
    webMpxLoaderPath,
    'node_modules/vue-loader/lib/index.js'
]);
function tsWatchRunLoaderFilter(loaders, loaderIndex) {
    for (let len = loaders.length; len > 0; --len) {
        const currentLoader = loaders[len - 1];
        if (!set_1.default.has(tsLoaderWatchRunFilterLoaders, filterLoaderPath => currentLoader.path.endsWith(filterLoaderPath))) {
            break;
        }
        loaderIndex--;
    }
    return loaderIndex;
}
exports.tsWatchRunLoaderFilter = tsWatchRunLoaderFilter;
//# sourceMappingURL=ts-loader-watch-run-loader-filter.js.map
module.exports.default && (module.exports = module.exports.default)