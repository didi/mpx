const path = require('path')
const async = require('async')
const toPosix = require('../utils/to-posix')

const MPX_CUSTOM_ELEMENT = 'mpx-custom-element'

const processMpxCustomElement = (mpx, packageName, callback) => {
  let outputPath = `${MPX_CUSTOM_ELEMENT}-${packageName}`
  if (packageName !== 'main') {
    outputPath = toPosix(path.join(packageName, outputPath))
  }
  const elementPath = path.resolve(__dirname, 'mpx-custom-element.mpx')
  if (!mpx.componentsMap[packageName]) {
    return callback()
  }
  // 挂载组件信息至 componentsMap
  mpx.componentsMap[packageName][elementPath] = outputPath
  // 添加自定义组件进入编译流程
  mpx.addEntry(elementPath + `?mpxCustomElement&isComponent&packageRoot=${packageName}`, outputPath, (err, module) => {
    // 自定义容器组件不缓存
    module.invalidateBuild()
    if (err) return callback(err)
    callback()
  })
}

module.exports = class RuntimeRenderPlugin {
  apply (compiler) {
    compiler.hooks.thisCompilation.tap({
      name: 'RuntimeRenderPlugin',
      stage: 1000
    }, (compilation) => {
      if (compilation.__mpx__) {
        const mpx = compilation.__mpx__

        // 使用了运行时渲染的 package
        mpx.usingRuntimePackages = new Set()
        // 以包为维度记录不同 package 需要的组件属性等信息，用以最终 mpx-custom-element 相关文件的输出
        mpx.runtimeInfo = {}

        mpx.hooks.finishSubpackagesMake.tapAsync('MpxCustomElementEntry', (compilation, callback) => {
          if (mpx.usingRuntimePackages.size === 0) {
            return callback()
          }

          const tasks = Array.from(mpx.usingRuntimePackages).map(pkg => (callback) => {
            processMpxCustomElement(mpx, pkg, callback)
          })
          async.parallel(tasks, () => {
            callback()
          })
        })
      }
    })
  }
}
