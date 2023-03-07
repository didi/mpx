"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'radio-group';
exports.default = (function () {
    return {
        test: TAG_NAME,
        web(_tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-radio-group';
        }
    };
});
//# sourceMappingURL=radio-group.js.map