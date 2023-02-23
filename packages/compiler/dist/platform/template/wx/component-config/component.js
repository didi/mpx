"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compiler_1 = require("../../../../template-compiler/compiler");
const compile_utils_1 = require("@mpxjs/compile-utils");
const TAG_NAME = 'component';
/** is 属性格式化为中划线(-)连接 */
const formatPropIs = (obj, data) => {
    const parsed = (0, compiler_1.parseMustache)(obj.value);
    let value = parsed.result;
    if (parsed.hasBinding)
        value = value.slice(1, -1);
    const el = data.el;
    if (el) {
        const injectWxsProp = {
            injectWxsPath: '~' + compile_utils_1.normalize.lib('runtime/utils.wxs'),
            injectWxsModuleName: '__wxsUtils__'
        };
        if (el.injectWxsProps && Array.isArray(el.injectWxsProps)) {
            el.injectWxsProps.push(injectWxsProp);
        }
        else {
            el.injectWxsProps = [injectWxsProp];
        }
    }
    return {
        name: 'is',
        value: `{{__wxsUtils__.humpToLine(${value})}}`
    };
};
function default_1() {
    return {
        test: TAG_NAME,
        props: [
            {
                test: 'is',
                ali(obj, data) {
                    return formatPropIs(obj, data);
                },
                swan(obj, data) {
                    return formatPropIs(obj, data);
                }
            }
        ]
    };
}
exports.default = default_1;
//# sourceMappingURL=component.js.map