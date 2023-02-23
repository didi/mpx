"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lru_cache_1 = __importDefault(require("lru-cache"));
const hash_sum_1 = __importDefault(require("hash-sum"));
const compiler_1 = __importDefault(require("./compiler"));
const source_map_1 = require("source-map");
const splitRE = /\r?\n/g;
const emptyRE = /^(?:\/\/)?\s*$/;
const cache = new lru_cache_1.default(100);
exports.default = (content, { filePath, needMap, mode, env }) => {
    // 缓存需要mode隔离，不同mode经过区块条件编译parseComponent得到的内容并不一致
    const cacheKey = (0, hash_sum_1.default)(filePath + content + mode + env);
    let output = cache.get(cacheKey);
    if (output)
        return JSON.parse(output);
    output = compiler_1.default.parseComponent(content, {
        mode,
        filePath,
        pad: 'line',
        env
    });
    if (needMap) {
        // 添加hash避免content被webpack的sourcemap覆盖
        const filename = filePath + '?' + cacheKey;
        // source-map cache busting for hot-reloadded modules
        if (output.script && !output.script.src) {
            output.script.map = generateSourceMap(filename, content, output.script.content);
        }
        if (output.styles) {
            output.styles.forEach((style) => {
                if (!style.src) {
                    style.map = generateSourceMap(filename, content, style.content);
                }
            });
        }
    }
    // 使用JSON.stringify进行序列化缓存，避免修改输出对象时影响到缓存
    cache.set(cacheKey, JSON.stringify(output));
    return output;
};
function generateSourceMap(filename, source, generated) {
    const map = new source_map_1.SourceMapGenerator();
    map.setSourceContent(filename, source);
    generated.split(splitRE).forEach((line, index) => {
        if (!emptyRE.test(line)) {
            map.addMapping({
                source: filename,
                original: {
                    line: index + 1,
                    column: 0
                },
                generated: {
                    line: index + 1,
                    column: 0
                }
            });
        }
    });
    return map.toJSON();
}
//# sourceMappingURL=parser.js.map