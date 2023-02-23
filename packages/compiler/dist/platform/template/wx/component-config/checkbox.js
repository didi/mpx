"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'checkbox';
function default_1() {
    return {
        test: TAG_NAME,
        web(tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-checkbox';
        },
        event: [
            {
                test: 'tap',
                ali() {
                    // 支付宝checkbox上不支持tap事件，change事件的表现和tap类似所以替换
                    return 'change';
                }
            }
        ]
    };
}
exports.default = default_1;
//# sourceMappingURL=checkbox.js.map