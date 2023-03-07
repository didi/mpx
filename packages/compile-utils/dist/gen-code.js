"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genAsyncImport = exports.genImport = void 0;
const stringify_1 = require("./stringify");
const genImport = (importer, name) => {
    return `import ${name ? `${name} from` : ''} ${(0, stringify_1.stringify)(importer)}`;
};
exports.genImport = genImport;
const genAsyncImport = (importer, name, callback) => {
    return `import(${importer})${name ? `.then((${name}) => ${callback})` : ''}`;
};
exports.genAsyncImport = genAsyncImport;
//# sourceMappingURL=gen-code.js.map