"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSplitPackageChunkPlugin = void 0;
const mpx_1 = __importDefault(require("../mpx"));
const descriptorCache_1 = require("../utils/descriptorCache");
/**
 * 将分包分离到额外的chunk里
 * @returns
 */
function createSplitPackageChunk() {
    const manualChunksOption = (id) => {
        if (/plugin-vue2:normalizer/.test(id)) {
            // 强制将normalizer分到vendor里去，否则会引起TDZ
            return 'vendor';
        }
        if (mpx_1.default.entry) {
            const descriptor = (0, descriptorCache_1.getDescriptor)(mpx_1.default.entry);
            if (descriptor) {
                const { jsonConfig } = descriptor;
                const { subpackages = [] } = jsonConfig;
                for (const { root } of subpackages) {
                    if (root && (id.includes(root))) {
                        return root;
                    }
                }
            }
        }
    };
    return manualChunksOption;
}
function createSplitPackageChunkPlugin() {
    return {
        name: 'vite:mpx-split-package-chunk',
        config(config) {
            var _a, _b;
            const output = (_b = (_a = config === null || config === void 0 ? void 0 : config.build) === null || _a === void 0 ? void 0 : _a.rollupOptions) === null || _b === void 0 ? void 0 : _b.output;
            if (output) {
                const outputs = Array.isArray(output) ? output : [output];
                for (const output of outputs) {
                    const splitPackageChunk = createSplitPackageChunk();
                    if (output && output.manualChunks) {
                        if (typeof output.manualChunks === 'function') {
                            const userManualChunks = output.manualChunks;
                            output.manualChunks = (...args) => {
                                var _a;
                                return (_a = userManualChunks(...args)) !== null && _a !== void 0 ? _a : splitPackageChunk(...args);
                            };
                        }
                    }
                    else {
                        output.manualChunks = splitPackageChunk;
                    }
                }
            }
            else {
                return {
                    build: {
                        rollupOptions: {
                            output: {
                                manualChunks: createSplitPackageChunk()
                            }
                        }
                    }
                };
            }
        }
    };
}
exports.createSplitPackageChunkPlugin = createSplitPackageChunkPlugin;
//# sourceMappingURL=splitPackageChunkPlugin.js.map