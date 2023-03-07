"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'image';
exports.default = (function ({ print }) {
    const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false });
    const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false });
    const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false });
    const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false });
    const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false });
    const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false });
    return {
        test: TAG_NAME,
        web(_tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-image';
        },
        props: [
            {
                test: /^show-menu-by-longpress$/,
                ali: aliPropLog,
                swan: baiduPropLog,
                qq: qqPropLog,
                tt: ttPropLog
            },
            {
                test: /^webp|show-menu-by-longpress$/,
                jd: jdPropLog
            },
            {
                test: /^(mode|lazy-load|show-menu-by-longpress|webp|use-built-in)$/,
                web(_prop, { el }) {
                    el.isBuiltIn = true;
                }
            },
            {
                test: /^(show-menu-by-longpress|webp)$/,
                qa: qaPropLog
            }
        ]
    };
});
//# sourceMappingURL=image.js.map