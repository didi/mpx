"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'switch';
function default_1({ print }) {
    const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false });
    const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false });
    return {
        test: TAG_NAME,
        web(tag, { el }) {
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
}
exports.default = default_1;
//# sourceMappingURL=switch.js.map