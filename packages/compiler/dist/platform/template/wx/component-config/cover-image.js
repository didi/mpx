"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'cover-image';
exports.default = (function ({ print }) {
    const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' });
    return {
        test: TAG_NAME,
        web(_tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-image';
        },
        tt() {
            return 'image';
        },
        props: [
            {
                test: 'use-built-in',
                web(_prop, { el }) {
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
});
//# sourceMappingURL=cover-image.js.map