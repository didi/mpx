"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'radio-group';
function default_1() {
    return {
        test: TAG_NAME,
        web(tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-radio-group';
        }
    };
}
exports.default = default_1;
//# sourceMappingURL=radio-group.js.map