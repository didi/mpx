"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compiler_1 = require("@mpxjs/compiler/template-compiler/compiler");
const type_1 = __importDefault(require("./type"));
function stringifyAttrs(attrs) {
    let result = '';
    Object.keys(attrs).forEach(function (name) {
        result += ' ' + name;
        let value = attrs[name];
        if (value != null && value !== true) {
            result += '=' + (0, compiler_1.stringifyAttr)(value);
        }
    });
    return result;
}
function genComponentTag(part, processor = {}) {
    // normalize
    if ((0, type_1.default)(processor) === 'Function') {
        processor = {
            content: processor
        };
    }
    if (part.content) {
        // unpad
        // part.content = '\n' + part.content.replace(/^\n*/m, '')
    }
    const tag = processor.tag ? processor.tag(part) : part.tag;
    const attrs = processor.attrs ? processor.attrs(part) : part.attrs;
    const content = processor.content ? processor.content(part) : part.content;
    let result = '';
    if (tag) {
        result += `<${tag}`;
        if (attrs) {
            result += stringifyAttrs(attrs);
        }
        if (content) {
            result += `>${content}</${tag}>`;
        }
        else {
            result += '/>';
        }
    }
    return result;
}
exports.default = genComponentTag;
//# sourceMappingURL=gen-component-tag.js.map
module.exports.default && (module.exports = module.exports.default)
