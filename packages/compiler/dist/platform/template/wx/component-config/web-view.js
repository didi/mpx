"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'web-view';
function default_1() {
    return {
        test: TAG_NAME,
        web(tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-web-view';
        }
    };
}
exports.default = default_1;
//# sourceMappingURL=web-view.js.map