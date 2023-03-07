"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'radio';
exports.default = (function () {
    return {
        test: TAG_NAME,
        web(_tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-radio';
        },
        event: [
            {
                test: 'tap',
                ali() {
                    // 支付宝radio上不支持tap事件，change事件的表现和tap类似所以替换
                    return 'change';
                }
            }
        ]
    };
});
//# sourceMappingURL=radio.js.map