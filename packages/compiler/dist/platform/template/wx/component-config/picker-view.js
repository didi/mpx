"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'picker-view';
function default_1({ print }) {
    const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' });
    const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false });
    const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false });
    const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' });
    const jdEventLog = print({ platform: 'jd', tag: TAG_NAME, isError: false, type: 'event' });
    return {
        test: TAG_NAME,
        web(tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-picker-view';
        },
        props: [
            {
                test: /^(indicator-class|mask-class)$/,
                tt: ttPropLog
            }
        ],
        event: [
            {
                test: /^(pickstart|pickend)$/,
                ali: aliEventLog,
                swan: baiduEventLog,
                tt: ttEventLog,
                jd: jdEventLog
            }
        ]
    };
}
exports.default = default_1;
//# sourceMappingURL=picker-view.js.map