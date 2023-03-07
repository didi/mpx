"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'web-view';
exports.default = (function () {
    return {
        test: TAG_NAME,
        web(_tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-web-view';
        }
    };
});
//# sourceMappingURL=web-view.js.map