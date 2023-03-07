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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scriptSetupCompiler = exports.platform = exports.jsonCompiler = exports.styleCompiler = exports.templateCompiler = void 0;
const platform_1 = __importDefault(require("./platform"));
exports.platform = platform_1.default;
const template_compiler_1 = __importDefault(require("./template-compiler"));
exports.templateCompiler = template_compiler_1.default;
const index_1 = __importDefault(require("./script-setup-compiler/index"));
exports.scriptSetupCompiler = index_1.default;
const style_compiler_1 = __importDefault(require("./style-compiler"));
exports.styleCompiler = style_compiler_1.default;
const json_compiler_1 = __importDefault(require("./json-compiler"));
exports.jsonCompiler = json_compiler_1.default;
__exportStar(require("./template-compiler/index"), exports);
__exportStar(require("./style-compiler/index"), exports);
__exportStar(require("./json-compiler"), exports);
//# sourceMappingURL=index.js.map