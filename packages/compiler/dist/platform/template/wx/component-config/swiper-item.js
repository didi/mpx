"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'swiper-item';
exports.default = (function ({ print }) {
    const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false });
    const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false });
    const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false });
    const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false });
    const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false });
    return {
        test: TAG_NAME,
        web(_tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-swiper-item';
        },
        props: [
            {
                test: /^(item-id)$/,
                ali: aliPropLog
            },
            {
                test: /^(skip-hidden-item-layout)$/,
                qa: qaPropLog,
                ali: aliPropLog,
                tt: ttPropLog,
                swan: baiduPropLog,
                qq: qqPropLog
            }
        ]
    };
});
//# sourceMappingURL=swiper-item.js.map