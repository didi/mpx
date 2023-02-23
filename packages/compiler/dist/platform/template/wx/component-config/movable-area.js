"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'movable-area';
function default_1({ print }) {
    return {
        test: TAG_NAME,
        web(tag, { el }) {
            el.isBuiltIn = true;
            return 'mpx-movable-area';
        }
    };
}
exports.default = default_1;
//# sourceMappingURL=movable-area.js.map