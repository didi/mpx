"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const json_process_1 = require("../../processor/json-process");
const mpx_1 = __importStar(require("../mpx"));
function default_1(jsonConfig, { loaderContext }, rawCallback) {
    return __awaiter(this, void 0, void 0, function* () {
        const output = '/* json */\n';
        let localPagesMap = {};
        let localComponentsMap = {};
        let tabBarMap = {};
        const context = loaderContext.context;
        const callback = (err) => {
            return rawCallback(err, {
                output,
                jsonConfig,
                localPagesMap,
                localComponentsMap,
                tabBarMap
            });
        };
        ({ jsonConfig, localPagesMap, localComponentsMap, tabBarMap } =
            yield (0, json_process_1.jsonProcess)({
                jsonConfig,
                pluginContext: loaderContext,
                context,
                options: (0, mpx_1.getOptions)(),
                mode: 'webpack',
                mpx: mpx_1.default
            }));
        callback();
    });
}
exports.default = default_1;
//# sourceMappingURL=process-json.js.map