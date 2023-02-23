"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'cover-image';
function default_1({ print }) {
    const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' });
    return {
        test: TAG_NAME,
        web(tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-image';
        },
        tt() {
            return 'image';
        },
        props: [
            {
                test: 'use-built-in',
                web(prop, { el }) {
                    el.isBuiltIn = true;
                }
            }
        ],
        event: [
            {
                test: /^(load|error)$/,
                ali: aliEventLog
            }
        ]
    };
}
exports.default = default_1;
//# sourceMappingURL=cover-image.js.map