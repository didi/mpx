"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const pageHash_1 = __importDefault(require("./pageHash"));
function getOutputPath(resourcePath, type, options, { ext = '', conflictPath = '' } = {}) {
    const name = path_1.default.parse(resourcePath).name;
    const hash = (0, pageHash_1.default)(resourcePath);
    const customOutputPath = options.customOutputPath;
    if (conflictPath)
        return conflictPath.replace(/(\.[^\\/]+)?$/, match => hash + match);
    if (typeof customOutputPath === 'function')
        return customOutputPath(type, name, hash, ext).replace(/^\//, '');
    if (type === 'component' || type === 'page')
        return path_1.default.join(type + 's', name + hash, 'index' + ext);
    return path_1.default.join(type, name + hash + ext);
}
exports.default = getOutputPath;
//# sourceMappingURL=get-output-path.js.map