"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processOptions = exports.optionKeys = void 0;
const compile_utils_1 = require("@mpxjs/compile-utils");
const externalsMap = {
    weui: /^weui-miniprogram/
};
exports.optionKeys = [];
function processOptions(rawOptions) {
    rawOptions.include = rawOptions.include || [/\.mpx$/];
    rawOptions.exclude = rawOptions.exclude || [];
    rawOptions.mode = rawOptions.mode || 'web';
    rawOptions.env = rawOptions.env || process.env.NODE_ENV || '';
    rawOptions.srcMode = rawOptions.srcMode || 'wx';
    if (rawOptions.mode !== rawOptions.srcMode && rawOptions.srcMode !== 'wx') {
        throw new Error('MpxWebpackPlugin supports srcMode to be "wx" only temporarily!');
    }
    if (rawOptions.mode === 'web' && rawOptions.srcMode !== 'wx') {
        throw new Error('MpxWebpackPlugin supports mode to be "web" only when srcMode is set to "wx"!');
    }
    rawOptions.externalClasses = rawOptions.externalClasses || [
        'custom-class',
        'i-class'
    ];
    rawOptions.writeMode = rawOptions.writeMode || 'changed';
    rawOptions.autoScopeRules = rawOptions.autoScopeRules || {};
    rawOptions.transMpxRules = rawOptions.transMpxRules || {
        include: () => true
    };
    // 通过默认defs配置实现mode及srcMode的注入，简化内部处理逻辑
    rawOptions.defs = (0, compile_utils_1.preProcessDefs)(Object.assign(Object.assign({}, rawOptions.defs), { __mpx_mode__: rawOptions.mode, __mpx_src_mode__: rawOptions.srcMode, __mpx_env__: rawOptions.env }));
    // 批量指定源码mode
    rawOptions.modeRules = rawOptions.modeRules || {};
    rawOptions.externals = (rawOptions.externals || []).map(external => {
        return typeof external === 'string'
            ? externalsMap[external] || external
            : external;
    });
    rawOptions.projectRoot = rawOptions.projectRoot || process.cwd();
    rawOptions.postcssInlineConfig = rawOptions.postcssInlineConfig || {};
    rawOptions.transRpxRules = rawOptions.transRpxRules || null;
    rawOptions.decodeHTMLText = rawOptions.decodeHTMLText || false;
    rawOptions.i18n = rawOptions.i18n || null;
    rawOptions.checkUsingComponents = rawOptions.checkUsingComponents || false;
    rawOptions.checkUsingComponentsRules =
        rawOptions.checkUsingComponentsRules ||
            (rawOptions.checkUsingComponents
                ? { include: () => true }
                : { exclude: () => true });
    rawOptions.pathHashMode = rawOptions.pathHashMode || 'absolute';
    rawOptions.fileConditionRules = rawOptions.fileConditionRules || {
        include: () => true
    };
    rawOptions.customOutputPath = rawOptions.customOutputPath || null;
    rawOptions.webConfig = rawOptions.webConfig || {};
    exports.optionKeys = Object.keys(rawOptions);
    return rawOptions;
}
exports.processOptions = processOptions;
//# sourceMappingURL=index.js.map