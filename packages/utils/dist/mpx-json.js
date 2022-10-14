"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileMPXJSONText = void 0;
const path_1 = __importDefault(require("path"));
// 将JS生成JSON
function compileMPXJSON({ source, defs, filePath }) {
    const defKeys = Object.keys(defs);
    const defValues = defKeys.map(key => {
        return defs[key];
    });
    // eslint-disable-next-line no-new-func
    const func = new Function('exports', 'require', 'module', '__filename', '__dirname', ...defKeys, source);
    // 模拟commonJS执行
    // support exports
    const e = {};
    const m = {
        exports: e
    };
    const dirname = path_1.default.dirname(filePath);
    func(e, function (modulePath) {
        if (!path_1.default.isAbsolute(modulePath)) {
            if (modulePath.indexOf('.') === 0) {
                modulePath = path_1.default.resolve(dirname, modulePath);
            }
        }
        return require(modulePath);
    }, m, filePath, dirname, ...defValues);
    return m.exports;
}
function compileMPXJSONText(opts) {
    return JSON.stringify(compileMPXJSON(opts), null, 2);
}
exports.compileMPXJSONText = compileMPXJSONText;
module.exports.default && (module.exports = module.exports.default)
//# sourceMappingURL=mpx-json.js.map
