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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const babylon = __importStar(require("@babel/parser"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const t = __importStar(require("@babel/types"));
const generator_1 = __importDefault(require("@babel/generator"));
function transDynamicClassExpr(expr, { error } = {}) {
    try {
        const ast = babylon.parse(expr, {
            plugins: [
                'objectRestSpread'
            ]
        });
        (0, traverse_1.default)(ast, {
            ObjectExpression(path) {
                path.node.properties.forEach((property) => {
                    if (t.isObjectProperty(property) && !property.computed) {
                        const propertyName = property.key.name || property.key.value;
                        if (/-/.test(propertyName)) {
                            if (/\$/.test(propertyName)) {
                                error && error(`Dynamic classname [${propertyName}] is not supported, which includes [-] char and [$] char at the same time.`);
                            }
                            else {
                                property.key = t.identifier(propertyName.replace(/-/g, '$$') + 'MpxDash');
                            }
                        }
                        else {
                            property.key = t.identifier(propertyName);
                        }
                    }
                });
            }
        });
        return (0, generator_1.default)(ast.program.body[0].expression, {
            compact: true
        }).code;
    }
    catch (e) {
        return expr;
    }
}
exports.default = transDynamicClassExpr;
//# sourceMappingURL=trans-dynamic-class-expr.js.map