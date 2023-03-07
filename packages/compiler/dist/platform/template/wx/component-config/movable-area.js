"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'movable-area';
exports.default = (function () {
    return {
        test: TAG_NAME,
        web(_tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-movable-area';
        }
    };
});
//# sourceMappingURL=movable-area.js.map