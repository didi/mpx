"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'text';
function default_1({ print }) {
    const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false });
    const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false });
    const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false });
    const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false });
    const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false });
    return {
        test: TAG_NAME,
        web(tag, { el }) {
            if (el.hasEvent) {
                el.isBuiltIn = true;
            }
            if (el.isBuiltIn) {
                return 'mpx-text';
            }
            else {
                return 'span';
            }
        },
        props: [
            {
                test: /^(decode|user-select)$/,
                swan: baiduPropLog
            },
            {
                test: /^(user-select)$/,
                ali: aliPropLog,
                tt: ttPropLog,
                qq: qqPropLog,
                qa: qaPropLog
            },
            {
                test: /^(selectable|space|decode|use-built-in)$/,
                web(prop, { el }) {
                    el.isBuiltIn = true;
                },
                qa: qaPropLog
            }
        ]
    };
}
exports.default = default_1;
//# sourceMappingURL=text.js.map