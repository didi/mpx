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
const compile_utils_1 = require("@mpxjs/compile-utils");
const descriptorCache_1 = require("./utils/descriptorCache");
function handleHotUpdate(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
        const prevDescriptor = (0, descriptorCache_1.getDescriptor)(ctx.file);
        if (!prevDescriptor)
            return;
        // 有descriptor缓存的是mpx文件或者外联json文件
        (0, descriptorCache_1.setPrevDescriptor)(ctx.file, prevDescriptor);
        // 改写read方法，vue内部热更新会调用
        ctx.read = function () {
            return __awaiter(this, void 0, void 0, function* () {
                // 增加type令mpx转换为一个默认的空的js并跳过vue插件转换
                const id = (0, compile_utils_1.addQuery)(ctx.file, {
                    type: 'hot',
                    vue: true,
                    isPage: prevDescriptor === null || prevDescriptor === void 0 ? void 0 : prevDescriptor.isPage,
                    app: prevDescriptor === null || prevDescriptor === void 0 ? void 0 : prevDescriptor.app,
                    isComponent: prevDescriptor === null || prevDescriptor === void 0 ? void 0 : prevDescriptor.isComponent
                });
                // 插件转换mpx文件并缓存代码到vueSfc
                yield ctx.server.transformRequest(id);
                const descriptor = (0, descriptorCache_1.getDescriptor)(ctx.file);
                // 给vue热更新返回转换后的代码，让其对比
                return (descriptor === null || descriptor === void 0 ? void 0 : descriptor.vueSfc) || '';
            });
        };
    });
}
exports.default = handleHotUpdate;
//# sourceMappingURL=handleHotUpdate.js.map