"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'checkbox';
exports.default = (function () {
    return {
        test: TAG_NAME,
        web(_tag, { el }) {
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
});
//# sourceMappingURL=checkbox.js.map