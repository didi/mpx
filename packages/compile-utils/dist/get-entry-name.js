"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntryName = void 0;
function getEntryName(loaderContext) {
    if (!loaderContext._compilation)
        return '';
    const moduleGraph = loaderContext._compilation.moduleGraph;
    let entryName = '';
    for (const [name, { dependencies }] of loaderContext._compilation.entries) {
        const entryModule = moduleGraph.getModule(dependencies[0]);
        if (entryModule && entryModule.resource === loaderContext.resource) {
            entryName = name;
            break;
        }
    }
    return entryName;
}
exports.getEntryName = getEntryName;
//# sourceMappingURL=get-entry-name.js.map
module.exports.default && (module.exports = module.exports.default)