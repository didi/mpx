"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPostcssConfig = void 0;
const postcss_load_config_1 = __importDefault(require("postcss-load-config"));
function loadPostcssConfig(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
context, inlineConfig = {}) {
    if (inlineConfig.ignoreConfigFile) {
        return Promise.resolve({
            file: '',
            plugins: [],
            options: {}
        });
    }
    const config = inlineConfig.config;
    const ctx = Object.assign({}, context);
    return (0, postcss_load_config_1.default)(ctx, config === null || config === void 0 ? void 0 : config.path, {
        loaders: { '.json': (_, content) => JSON.parse(content) }
    })
        .catch(err => {
        // postcss-load-config throws error when no config file is found,
        // but for us it's optional. only emit other errors
        if (err.message.indexOf('No PostCSS Config found') >= 0) {
            return;
        }
        throw new Error(`Error loading PostCSS config: ${err.message}`);
    })
        .then(config => {
        let plugins = inlineConfig.plugins || [];
        let options = inlineConfig.options || {};
        let file = '';
        // merge postcss config file
        if (config && config.plugins) {
            plugins = plugins.concat(config.plugins);
        }
        if (config && config.options) {
            options = Object.assign({}, config.options, options);
        }
        if (config && config.file) {
            file = config.file;
        }
        return {
            file,
            plugins,
            options
        };
    });
}
exports.loadPostcssConfig = loadPostcssConfig;
//# sourceMappingURL=loadPostcssConfig.js.map
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)
module.exports.default && (module.exports = module.exports.default)