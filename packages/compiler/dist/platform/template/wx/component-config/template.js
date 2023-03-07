"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'template';
exports.default = (function () {
    return {
        test: TAG_NAME,
        props: [
            {
                test: 'data',
                swan({ name, value }) {
                    return {
                        name,
                        value: `{${value}}`
                    };
                }
            }
        ]
    };
});
//# sourceMappingURL=template.js.map