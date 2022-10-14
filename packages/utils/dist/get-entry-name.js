"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(loaderContext) {
    if (!loaderContext._compilation)
        return '';
    const moduleGraph = loaderContext._compilation.moduleGraph;
    let entryName = '';
    for (const [name, { dependencies }] of loaderContext._compilation.entries) {
        const entryModule = moduleGraph.getModule(dependencies[0]);
        if (entryModule.resource === loaderContext.resource) {
            entryName = name;
            break;
        }
    }
    return entryName;
}
exports.default = default_1;
//# sourceMappingURL=get-entry-name.js.map
module.exports.default && (module.exports = module.exports.default)
