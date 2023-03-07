"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'checkbox-group';
exports.default = (function () {
    return {
        test: TAG_NAME,
        web(_tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-checkbox-group';
        }
    };
});
//# sourceMappingURL=checkbox-group.js.map