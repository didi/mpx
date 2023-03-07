"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'switch';
exports.default = (function ({ print }) {
    const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false });
    const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false });
    return {
        test: TAG_NAME,
        web(_tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-switch';
        },
        props: [
            {
                test: /^type$/,
                ali: aliPropLog
            },
            {
                test: /^disabled$/,
                jd: jdPropLog
            }
        ]
    };
});
//# sourceMappingURL=switch.js.map