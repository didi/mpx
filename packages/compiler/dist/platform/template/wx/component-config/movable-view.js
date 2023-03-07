"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'movable-view';
exports.default = (function ({ print }) {
    const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' });
    const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false });
    return {
        test: TAG_NAME,
        web(_tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-movable-view';
        },
        props: [
            {
                test: /^(out-of-bounds)$/,
                ali: qaPropLog
            }
        ],
        event: [
            {
                test: /^(htouchmove|vtouchmove)$/,
                ali: aliEventLog
            }
        ]
    };
});
//# sourceMappingURL=movable-view.js.map