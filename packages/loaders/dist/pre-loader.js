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
const compile_utils_1 = require("@mpxjs/compile-utils");
const loader_utils_1 = require("loader-utils");
const preLoader = function (content) {
    this.cacheable();
    const module = this._module;
    // @ts-ignore
    const mpx = this.getMpx();
    const mode = mpx.mode;
    const wxsModule = (0, loader_utils_1.parseQuery)(this.resourceQuery || '?').wxsModule;
    // 处理内联wxs
    if (wxsModule) {
        const wxsContentMap = mpx.wxsContentMap;
        const resourcePath = (0, compile_utils_1.parseRequest)(this.resource).resourcePath;
        content = wxsContentMap[`${resourcePath}~${wxsModule}`] || content;
    }
    let visitor = {};
    // @ts-ignore
    if (module === null || module === void 0 ? void 0 : module.wxs) {
        if (mode === 'ali') {
            const insertNodes = babylon.parse('var __mpx_args__ = [];\n' +
                'for (var i = 0; i < arguments.length; i++) {\n' +
                '  __mpx_args__[i] = arguments[i];\n' +
                '}').program.body;
            // todo Object.assign可能会覆盖，未来存在非预期的覆盖case时需要改进处理
            Object.assign(visitor, {
                Identifier(path) {
                    if (path.node.name === 'arguments') {
                        path.node.name = '__mpx_args__';
                        const targetPath = path.getFunctionParent().get('body');
                        if (!targetPath.inserted) {
                            const results = targetPath.unshiftContainer('body', insertNodes) || [];
                            targetPath.inserted = true;
                            results.forEach((item) => {
                                item.shouldStopTraverse = true;
                            });
                        }
                    }
                },
                ForStatement(path) {
                    if (path.shouldStopTraverse) {
                        path.stop();
                    }
                },
                // 处理vant-aliapp中export var bem = bem;这种不被acorn支持的2b语法
                ExportNamedDeclaration(path) {
                    if (path.node.declaration &&
                        path.node.declaration.declarations.length === 1 &&
                        path.node.declaration.declarations[0].id.name === path.node.declaration.declarations[0].init.name) {
                        const name = path.node.declaration.declarations[0].id.name;
                        path.replaceWith(t.exportNamedDeclaration(undefined, [t.exportSpecifier(t.identifier(name), t.identifier(name))]));
                    }
                }
            });
        }
        if (mode !== 'wx') {
            Object.assign(visitor, {
                CallExpression(path) {
                    const callee = path.node.callee;
                    if (t.isIdentifier(callee) && callee.name === 'getRegExp') {
                        const argPath = path.get('arguments')[0];
                        if (argPath.isStringLiteral()) {
                            argPath.replaceWith(t.stringLiteral(argPath.node.extra.raw.slice(1, -1)));
                        }
                    }
                }
            });
        }
    }
    if (mode === 'dd') {
        Object.assign(visitor, {
            MemberExpression(path) {
                const property = path.node.property;
                if ((property.name === 'constructor' || property.value === 'constructor') &&
                    !(t.isMemberExpression(path.parent) && path.parentKey === 'object')) {
                    path.replaceWith(t.logicalExpression('||', t.memberExpression(path.node, t.identifier('name')), path.node));
                    path.skip();
                }
            }
        });
    }
    // @ts-ignore
    if (!(module === null || module === void 0 ? void 0 : module.wxs)) {
        visitor = Object.assign(Object.assign({}, visitor), { MemberExpression(path) {
                const property = path.node.property;
                if ((property.name === 'constructor' ||
                    property.value === 'constructor') &&
                    !(t.isMemberExpression(path.parent) && path.parentKey === 'object')) {
                    path.replaceWith(t.memberExpression(path.node, t.identifier('name')));
                    path.skip();
                }
            },
            CallExpression(path) {
                const callee = path.node.callee;
                const args = path.node.arguments;
                const transMap = {
                    getDate: 'Date',
                    getRegExp: 'RegExp'
                };
                if (t.isIdentifier(callee) && transMap[callee.name]) {
                    if (callee.name === 'getRegExp') {
                        const arg = args[0];
                        if (t.isStringLiteral(arg) &&
                            arg.extra &&
                            arg.extra.raw &&
                            typeof arg.extra.raw === 'string') {
                            args[0] = t.stringLiteral(arg.extra.raw.slice(1, -1));
                        }
                    }
                    path.replaceWith(t.newExpression(t.identifier(transMap[callee.name]), args));
                }
            } });
    }
    if (!(0, compile_utils_1.isEmptyObject)(visitor)) {
        const ast = babylon.parse(content, {
            sourceType: 'module'
        });
        (0, traverse_1.default)(ast, visitor);
        return (0, generator_1.default)(ast).code;
    }
    else {
        return content;
    }
};
exports.default = preLoader;
//# sourceMappingURL=pre-loader.js.map