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
exports.processJSON = void 0;
const json_compiler_1 = require("../../transfrom/json-compiler");
const resolve_json_content_1 = __importDefault(require("../../utils/resolve-json-content"));
const mpx_1 = __importDefault(require("../mpx"));
function processJSON(descriptor, options, pluginContext) {
    return __awaiter(this, void 0, void 0, function* () {
        const jsonConfig = (descriptor.jsonConfig = yield (0, resolve_json_content_1.default)(descriptor, descriptor.filename, pluginContext, options));
        try {
            const jsonResult = yield (0, json_compiler_1.jsonCompiler)({
                jsonConfig,
                pluginContext,
                context: jsonConfig.path || descriptor.filename,
                options,
                mode: 'vite',
                mpx: mpx_1.default
            });
            descriptor.localPagesMap = jsonResult.localPagesMap;
            descriptor.localComponentsMap = jsonResult.localComponentsMap;
            descriptor.tabBarMap = jsonResult.tabBarMap;
        }
        catch (error) {
            pluginContext.error(`[mpx] process json error: ${error}`);
        }
    });
}
exports.processJSON = processJSON;
//# sourceMappingURL=json.js.map