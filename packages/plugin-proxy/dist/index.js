"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyPluginContext = void 0;
/**
 * 代理webpack loader 和 vite plugin 的上下文，并返回统一的格式
 * @param pluginContext
 * @param rollupOptions
 * @returns
 */
function proxyPluginContext(pluginContext, rollupOptions) {
    if ('mode' in pluginContext) {
        return {
            resolve: (request, context) => new Promise((resolve, reject) => {
                pluginContext.resolve(context, request, (err, res) => {
                    if (err)
                        return reject(err);
                    resolve({
                        id: res
                    });
                });
            }),
            addDependency: pluginContext.addDependency.bind(pluginContext),
            addBuildDependency: pluginContext.addBuildDependency.bind(pluginContext),
            addMissingDependency: pluginContext.addMissingDependency.bind(pluginContext),
            addContextDependency: pluginContext.addContextDependency.bind(pluginContext),
            cacheable: pluginContext.cacheable.bind(pluginContext),
            async: pluginContext.async.bind(pluginContext),
            resource: pluginContext.resource,
            sourceMap: pluginContext.sourceMap,
            warn: pluginContext.emitWarning.bind(pluginContext),
            error: pluginContext.emitError.bind(pluginContext),
            emitFile: pluginContext.emitFile.bind(pluginContext)
        };
    }
    else {
        return {
            resolve: pluginContext.resolve.bind(pluginContext),
            addDependency: pluginContext.addWatchFile.bind(pluginContext),
            warn: pluginContext.warn.bind(pluginContext),
            error: pluginContext.error.bind(pluginContext),
            cacheable: function () { },
            async: function () { },
            resource: rollupOptions === null || rollupOptions === void 0 ? void 0 : rollupOptions.moduleId,
            sourceMap: rollupOptions === null || rollupOptions === void 0 ? void 0 : rollupOptions.sourceMap,
            addBuildDependency: function () { },
            addMissingDependency: function () { },
            addContextDependency: function () { },
            emitFile: pluginContext.emitFile.bind(pluginContext),
        };
    }
}
exports.proxyPluginContext = proxyPluginContext;
//# sourceMappingURL=index.js.map
module.exports.default && (module.exports = module.exports.default)