"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'checkbox-group';
function default_1() {
    return {
        test: TAG_NAME,
        web(tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-checkbox-group';
        }
    };
}
exports.default = default_1;
//# sourceMappingURL=checkbox-group.js.map