"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'icon';
function default_1() {
    return {
        test: TAG_NAME,
        web(tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-icon';
        }
    };
}
exports.default = default_1;
//# sourceMappingURL=icon.js.map