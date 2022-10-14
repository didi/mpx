"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
function addInfix(resourcePath, infix, extname) {
    extname = extname || path_1.default.extname(resourcePath);
    return (resourcePath.substring(0, resourcePath.length - extname.length) +
        '.' +
        infix +
        extname);
}
exports.default = addInfix;
module.exports.default && (module.exports = module.exports.default)
//# sourceMappingURL=add-infix.js.map
