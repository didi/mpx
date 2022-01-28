const {
  compareModulesByPreOrderIndexOrIdentifier
} = require('webpack/lib/util/comparators')
const { assignAscendingModuleIds } = require('webpack/lib/ids/IdHelpers')

/** @typedef {import("../Compiler")} Compiler */
/** @typedef {import("../Module")} Module */

class WxsModuleIdsPlugin {
  apply (compilation) {
    compilation.hooks.moduleIds.tap({
      name: 'WxsModuleIdsPlugin',
      // 放在最前面执行，确保生成的代码模块为数组形式，符合wxs规范
      stage: -1000
    }, modules => {
      const chunkGraph = compilation.chunkGraph
      const modulesInNaturalOrder = Array.from(modules)
        .filter(
          m =>
            m.needId &&
            chunkGraph.getNumberOfModuleChunks(m) > 0 &&
            chunkGraph.getModuleId(m) === null
        )
        .sort(
          compareModulesByPreOrderIndexOrIdentifier(compilation.moduleGraph)
        )
      assignAscendingModuleIds(modulesInNaturalOrder, compilation)
    })
  }
}

module.exports = WxsModuleIdsPlugin
