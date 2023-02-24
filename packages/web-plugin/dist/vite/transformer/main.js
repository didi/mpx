"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformMain = void 0;
const descriptorCache_1 = require("../utils/descriptorCache");
const json_1 = require("./json");
const script_1 = require("./script");
const style_1 = require("./style");
const template_1 = require("./template");
function transformMain(code, filename, query, options, pluginContext) {
    return __awaiter(this, void 0, void 0, function* () {
        const descriptor = (0, descriptorCache_1.createDescriptor)(filename, code, query, options);
        if (descriptor) {
            // set pages/component to descriptor
            yield (0, json_1.processJSON)(descriptor, options, pluginContext);
            // generate template block, delay transform template
            const templateBlock = yield (0, template_1.genTemplateBlock)(descriptor, options, pluginContext);
            // transform script
            const { code, map } = yield (0, script_1.transformScript)(descriptor, options, pluginContext);
            // generate script block
            const scriptBlock = yield (0, script_1.genScriptBlock)(descriptor, code);
            // generate styles block, delay transform style
            const stylesBlock = yield (0, style_1.genStylesBlock)(descriptor);
            const vueSfc = genVueSfc(templateBlock, scriptBlock, stylesBlock);
            if (query.type === 'hot')
                descriptor.vueSfc = vueSfc;
            return {
                code: vueSfc,
                map: map
            };
        }
    });
}
exports.transformMain = transformMain;
function genVueSfc(...args) {
    return args.map(v => v.output).join();
}
//# sourceMappingURL=main.js.map