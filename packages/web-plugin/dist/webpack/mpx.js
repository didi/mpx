"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOptions = void 0;
const pick_1 = __importDefault(require("lodash/pick"));
const options_1 = require("../options");
const mpx = {};
function getOptions() {
    return (0, pick_1.default)(mpx, options_1.optionKeys);
}
exports.getOptions = getOptions;
exports.default = mpx;
//# sourceMappingURL=mpx.js.map