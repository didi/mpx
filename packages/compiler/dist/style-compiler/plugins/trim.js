"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => {
    return {
        postcssPlugin: 'trim',
        Once: (root) => {
            root.walk(({ type, raws }) => {
                if (type === 'rule' || type === 'atrule') {
                    raws.before = raws.after = '\n';
                }
            });
        }
    };
};
module.exports.postcss = true;
//# sourceMappingURL=trim.js.map