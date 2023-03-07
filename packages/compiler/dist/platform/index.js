"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const run_rules_1 = __importDefault(require("./run-rules"));
const wx_1 = __importDefault(require("./template/wx"));
const wx_2 = __importDefault(require("./json/wx"));
function getRulesRunner({ type, mode, srcMode, data, meta, testKey, mainKey, waterfall, warn, error }) {
    const specMap = {
        template: {
            wx: (0, wx_1.default)({ warn, error })
        },
        json: {
            wx: (0, wx_2.default)({ warn, error })
        }
    };
    const spec = specMap[type] && specMap[type][srcMode];
    if (spec && spec.supportedModes.indexOf(mode) > -1) {
        const normalizeTest = spec.normalizeTest;
        const mainRules = mainKey ? spec[mainKey] : spec;
        if (mainRules) {
            return function (input) {
                return (0, run_rules_1.default)(mainRules, input, { mode, data, meta, testKey, waterfall, normalizeTest });
            };
        }
    }
}
exports.default = getRulesRunner;
//# sourceMappingURL=index.js.map