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
const names = 'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require,global';
const hash = {};
names.split(',').forEach(function (name) {
    hash[name] = true;
});
const dangerousKeys = 'length,size,prototype';
const dangerousKeyMap = {};
dangerousKeys.split(',').forEach((key) => {
    dangerousKeyMap[key] = true;
});
exports.default = {
    transform(code, { needCollect = false, ignoreMap = {} } = {}) {
        const ast = babylon.parse(code, {
            plugins: [
                'objectRestSpread'
            ]
        });
        const propKeys = [];
        let isProps = false;
        const bindThisVisitor = {
            // 标记收集props数据
            CallExpression: {
                enter(path) {
                    const callee = path.node.callee;
                    if (t.isMemberExpression(callee) &&
                        t.isThisExpression(callee.object) &&
                        (callee.property.name === '_p' || callee.property.value === '_p')) {
                        isProps = true;
                        path.isProps = true;
                    }
                },
                exit(path) {
                    if (path.isProps) {
                        // 移除无意义的__props调用
                        path.replaceWith(path.node.arguments[0]);
                        isProps = false;
                        delete path.isProps;
                    }
                }
            },
            Identifier(path) {
                if (!(t.isDeclaration(path.parent) && path.parentKey === 'id') &&
                    !(t.isFunction(path.parent) && path.listKey === 'params') &&
                    !(t.isMethod(path.parent) && path.parentKey === 'key' && !path.parent.computed) &&
                    !(t.isProperty(path.parent) && path.parentKey === 'key' && !path.parent.computed) &&
                    !(t.isMemberExpression(path.parent) && path.parentKey === 'property' && !path.parent.computed) &&
                    !t.isArrayPattern(path.parent) &&
                    !t.isObjectPattern(path.parent) &&
                    !hash[path.node.name]) {
                    let current;
                    let last;
                    if (!path.scope.hasBinding(path.node.name) && !ignoreMap[path.node.name]) {
                        // bind this
                        path.replaceWith(t.memberExpression(t.thisExpression(), path.node));
                        if (isProps) {
                            propKeys.push(path.node.property.name);
                        }
                        if (needCollect) {
                            // 找到访问路径
                            current = path.parentPath;
                            last = path;
                            let keyPath = '' + path.node.property.name;
                            while (current.isMemberExpression() && last.parentKey !== 'property') {
                                if (current.node.computed) {
                                    if (t.isLiteral(current.node.property)) {
                                        if (t.isStringLiteral(current.node.property)) {
                                            if (dangerousKeyMap[current.node.property.value]) {
                                                break;
                                            }
                                            keyPath += `.${current.node.property.value}`;
                                        }
                                        else {
                                            keyPath += `[${current.node.property.value}]`;
                                        }
                                    }
                                    else {
                                        break;
                                    }
                                }
                                else {
                                    if (dangerousKeyMap[current.node.property.name]) {
                                        break;
                                    }
                                    keyPath += `.${current.node.property.name}`;
                                }
                                last = current;
                                current = current.parentPath;
                            }
                            last.collectPath = t.stringLiteral(keyPath);
                        }
                    }
                }
            },
            MemberExpression: {
                exit(path) {
                    if (path.collectPath) {
                        path.replaceWith(t.callExpression(t.memberExpression(t.thisExpression(), t.identifier('_c')), [path.collectPath, path.node]));
                        delete path.collectPath;
                    }
                }
            }
        };
        (0, traverse_1.default)(ast, bindThisVisitor);
        return {
            code: (0, generator_1.default)(ast).code,
            propKeys
        };
    }
};
//# sourceMappingURL=bind-this.js.map