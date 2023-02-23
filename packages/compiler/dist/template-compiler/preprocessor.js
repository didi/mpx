"use strict";
// loader for pre-processing templates with e.g. pug
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const consolidate_1 = __importDefault(require("consolidate"));
const loader_utils_1 = __importDefault(require("loader-utils"));
exports.default = (function (content) {
    this.cacheable && this.cacheable();
    const callback = this.async();
    // @ts-ignore
    const opt = loader_utils_1.default.getOptions(this) || {};
    // @ts-ignore
    if (!consolidate_1.default[opt.engine]) {
        return callback(new Error('Template engine \'' + opt.engine + '\' ' +
            'isn\'t available in Consolidate.js'));
    }
    const templateOption = opt.templateOption;
    // for relative includes
    templateOption.filename = this.resourcePath;
    // @ts-ignore
    consolidate_1.default[opt.engine].render(content, templateOption, function (err, html) {
        if (err) {
            return callback(err);
        }
        callback(null, html);
    });
});
//# sourceMappingURL=preprocessor.js.map