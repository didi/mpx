"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genComponentTag = void 0;
const type_1 = require("./type");
function stringifyAttr(val) {
    if (typeof val === 'string') {
        const hasSingle = val.indexOf("'") > -1;
        const hasDouble = val.indexOf('"') > -1;
        // 移除属性中换行
        val = val.replace(/\n/g, '');
        if (hasSingle && hasDouble) {
            val = val.replace(/'/g, '"');
        }
        if (hasDouble) {
            return `'${val}'`;
        }
        else {
            return `"${val}"`;
        }
    }
}
function stringifyAttrs(attrs) {
    let result = '';
    Object.keys(attrs).forEach(function (name) {
        result += ' ' + name;
        const value = attrs[name];
        if (value != null && value !== true) {
            result += '=' + stringifyAttr(value);
        }
    });
    return result;
}
function genComponentTag(part, processor = {}) {
    // normalize
    if ((0, type_1.type)(processor) === 'Function') {
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
exports.genComponentTag = genComponentTag;
//# sourceMappingURL=gen-component-tag.js.map
module.exports.default && (module.exports = module.exports.default)