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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genTemplateBlock = exports.transformTemplate = void 0;
const compile_utils_1 = require("@mpxjs/compile-utils");
const template_compiler_1 = __importDefault(require("../../transfrom/template-compiler"));
/**
 * transform mpx template to vue template
 * @param code - mpx template code
 * @param filename - filename
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
function transformTemplate(descriptor, options, pluginContext) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, filename, jsonConfig, app, template } = descriptor;
        let builtInComponentsMap = {};
        let genericsInfo;
        let wxsContentMap = {};
        let wxsModuleMap = {};
        let templateContent = '';
        if (template) {
            ({
                wxsModuleMap,
                wxsContentMap,
                genericsInfo,
                builtInComponentsMap,
                templateContent
            } = (0, template_compiler_1.default)({
                template,
                options,
                pluginContext,
                jsonConfig,
                app,
                resource: filename,
                moduleId: id
            }));
        }
        descriptor.wxsModuleMap = wxsModuleMap;
        descriptor.wxsContentMap = wxsContentMap;
        descriptor.genericsInfo = genericsInfo;
        descriptor.builtInComponentsMap = builtInComponentsMap;
        return {
            code: templateContent,
            map: null
        };
    });
}
exports.transformTemplate = transformTemplate;
/**
 * gen template block
 * @param descriptor - SFCDescriptor
 * @returns <template>descriptor.template.content</template>
 */
function genTemplateBlock(descriptor, options, pluginContext) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const templateContent = yield transformTemplate(descriptor, options, pluginContext);
        return {
            output: (0, compile_utils_1.genComponentTag)({
                content: (templateContent === null || templateContent === void 0 ? void 0 : templateContent.code) || '',
                tag: 'template',
                attrs: (_a = descriptor.template) === null || _a === void 0 ? void 0 : _a.attrs
            })
        };
    });
}
exports.genTemplateBlock = genTemplateBlock;
//# sourceMappingURL=template.js.map