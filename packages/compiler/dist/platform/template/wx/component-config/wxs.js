"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TAG_NAME = 'wxs';
function default_1({ print }) {
    return {
        // 匹配标签名，可传递正则
        test: TAG_NAME,
        ali() {
            return 'import-sjs';
        },
        swan() {
            return 'import-sjs';
        },
        qq() {
            return 'qs';
        },
        jd() {
            return 'jds';
        },
        tt() {
            return 'sjs';
        },
        qa() {
            return 'qjs';
        },
        dd() {
            return 'dds';
        },
        // 组件属性中的差异部分
        props: [
            {
                test: 'src',
                ali(obj) {
                    obj.name = 'from';
                    return obj;
                },
                qa(obj) {
                    obj.name = 'from';
                    return obj;
                }
            },
            {
                test: 'module',
                ali(obj) {
                    obj.name = 'name';
                    return obj;
                },
                qa(obj) {
                    obj.name = 'name';
                    return obj;
                }
            }
        ]
    };
}
exports.default = default_1;
//# sourceMappingURL=wxs.js.map