"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModuleContext = void 0;
const path_1 = __importDefault(require("path"));
function resolveModuleContext(moduleId) {
    return path_1.default.dirname(moduleId);
}
exports.resolveModuleContext = resolveModuleContext;
//# sourceMappingURL=resolve-module-context.js.map