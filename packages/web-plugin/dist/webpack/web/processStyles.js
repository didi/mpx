"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compile_utils_1 = require("@mpxjs/compile-utils");
function default_1(styles, options, callback) {
    let output = '/* styles */\n';
    if (styles.length) {
        styles.forEach(style => {
            output += (0, compile_utils_1.genComponentTag)(style, {
                attrs(style) {
                    const attrs = Object.assign({}, style.attrs);
                    if (options.autoScope)
                        attrs.scoped = true;
                    attrs.mpxStyleOptions = JSON.stringify({
                        // scoped: !!options.autoScope,
                        // query中包含module字符串会被新版vue-cli中的默认rules当做css-module处理
                        mid: options.moduleId
                    });
                    return attrs;
                }
            });
            output += '\n';
        });
        output += '\n';
    }
    callback(null, {
        output
    });
}
exports.default = default_1;
//# sourceMappingURL=processStyles.js.map