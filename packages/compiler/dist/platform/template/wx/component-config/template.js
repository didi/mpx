"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'template';
function default_1() {
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
}
exports.default = default_1;
//# sourceMappingURL=template.js.map