"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genAsyncImport = exports.genImport = void 0;
const stringify_1 = __importDefault(require("./stringify"));
const genImport = (importer, name) => {
    return `import ${name ? `${name} from` : ''} ${(0, stringify_1.default)(importer)}`;
};
exports.genImport = genImport;
const genAsyncImport = (importer, name, callback) => {
    return `import(${importer})${name ? `.then((${name}) => ${callback})` : ''}`;
};
exports.genAsyncImport = genAsyncImport;
//# sourceMappingURL=genCode.js.map