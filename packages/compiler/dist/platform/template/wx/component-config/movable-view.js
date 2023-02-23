"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'movable-view';
function default_1({ print }) {
    const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' });
    const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false });
    return {
        test: TAG_NAME,
        web(tag, { el }) {
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
}
exports.default = default_1;
//# sourceMappingURL=movable-view.js.map