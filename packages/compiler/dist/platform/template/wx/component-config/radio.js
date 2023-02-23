"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'radio';
function default_1() {
    return {
        test: TAG_NAME,
        web(tag, { el }) {
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
}
exports.default = default_1;
//# sourceMappingURL=radio.js.map