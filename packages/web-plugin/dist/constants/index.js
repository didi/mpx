"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TAB_BAR_CONFIG = exports.TAB_BAR_CONTAINER_PATH = exports.TAB_BAR_PATH = exports.OPTION_PROCESSOR_PATH = exports.MPX_APP_MODULE_ID = exports.JSON_JS_EXT = exports.RESOLVE_IGNORED_ERR = void 0;
const compile_utils_1 = require("@mpxjs/compile-utils");
exports.RESOLVE_IGNORED_ERR = new Error('Resolve ignored!');
exports.JSON_JS_EXT = '.json.js';
exports.MPX_APP_MODULE_ID = 'mpx-app-scope'; // app文件moduleId
exports.OPTION_PROCESSOR_PATH = compile_utils_1.normalize.runtime('optionProcessor');
exports.TAB_BAR_PATH = compile_utils_1.normalize.runtime('components/web/mpx-tab-bar.vue');
exports.TAB_BAR_CONTAINER_PATH = compile_utils_1.normalize.runtime('components/web/mpx-tab-bar-container.vue');
exports.DEFAULT_TAB_BAR_CONFIG = {
    borderStyle: 'black',
    position: 'bottom',
    custom: false,
    isShow: true
};
//# sourceMappingURL=index.js.map