"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'icon';
exports.default = (function () {
    return {
        test: TAG_NAME,
        web(_tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-icon';
        }
    };
});
//# sourceMappingURL=icon.js.map