"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    hump2dash(value) {
        return value.replace(/[A-Z]/g, function (match) {
            return '-' + match.toLowerCase();
        });
    },
    dash2hump(value) {
        return value.replace(/-([a-z])/g, function (match, p1) {
            return p1.toUpperCase();
        });
    }
};
//# sourceMappingURL=hump-dash.js.map