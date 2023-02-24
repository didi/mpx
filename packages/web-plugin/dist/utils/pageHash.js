"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hash_sum_1 = __importDefault(require("hash-sum"));
const path_1 = __importDefault(require("path"));
function pathHash(resourcePath, options) {
    let hashPath = resourcePath;
    const pathHashMode = options === null || options === void 0 ? void 0 : options.pathHashMode;
    const projectRoot = (options === null || options === void 0 ? void 0 : options.projectRoot) || '';
    if (pathHashMode === 'relative') {
        hashPath = path_1.default.relative(projectRoot, resourcePath);
    }
    if (typeof pathHashMode === 'function') {
        hashPath = pathHashMode(resourcePath, projectRoot) || resourcePath;
    }
    return (0, hash_sum_1.default)(hashPath);
}
exports.default = pathHash;
//# sourceMappingURL=pageHash.js.map