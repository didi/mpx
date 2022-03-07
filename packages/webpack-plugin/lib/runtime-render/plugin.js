const path = require('path')
const normalize = require('../utils/normalize')
const async = require('async')
const parseRequest = require('../utils/parse-request')
const { MPX_PROCESSED_FLAG } = require('../utils/const')
const addQuery = require('../utils/add-query')
const loader = normalize.lib('runtime-render/loader')
const stringifyLoadersAndResource = require('../utils/stringify-loaders-resource')
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
    }, (compilation, { normalModuleFactory }) => {
      if (compilation.__mpx__) {
        const mpx = compilation.__mpx__

        // 使用了运行时渲染的 package
        mpx.usingRuntimePackages = new Set()
        // 以包为维度记录不同 package 需要的组件属性等信息，用以最终 mpx-custom-element 相关文件的输出
        mpx.runtimeInfo = {}
        // 记录每个 page/component 依赖的组件相关信息，供 template-compiler 消费使用
        mpx.componentDependencyInfo = {}

        mpx.getComponentDependencyInfo = function (resourcePath) {
          // 使用全局组件初始化
          const runtimeComponents = [].concat(Object.keys(mpx.usingComponents))
          if (mpx.componentDependencyInfo[resourcePath]) {
            const componentInfo = mpx.componentDependencyInfo[resourcePath]
            runtimeComponents.push(...Object.keys(componentInfo).filter(c => componentInfo[c].isRuntimeComponent))
            return {
              componentDependencyInfo: componentInfo,
              runtimeComponents
            }
          }
          return {
            componentDependencyInfo: {},
            runtimeComponents
          }
        }

        // 注入到 mpx-custom-element-*.json 里面的组件路径
        mpx.getPackageInjectedComponentsMap = function (packageName = 'main') {
          let res = {}
          let componentsMap = Object.values(mpx.componentsMap).reduce((preVal, curVal) => Object.assign(preVal, curVal), {})
          const resourceHashNameMap = mpx.runtimeInfo[packageName].resourceHashNameMap
          const outputPath = compilation.outputOptions.publicPath || ''
          for (let path in resourceHashNameMap) {
            const hashName = resourceHashNameMap[path]
            if (hashName && componentsMap[path]) {
              res[hashName] = outputPath + componentsMap[path]
            }
          }

          return res
        }

        // 注入到 mpx-custom-element-*.wxss 里面的引用路径
        mpx.getPackageInjectedWxss = function (packageName = 'main') {
          return Object.values(mpx.getPackageInjectedComponentsMap(packageName))
            .map(resultPath => `@import '${resultPath}.wxss';\n`).join('')
        }

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

        normalModuleFactory.hooks.afterResolve.tap({
          name: 'MpxRuntimeRender',
          stage: compilation.PROCESS_ASSETS_STAGE_OPTIMIZE
        }, (resolveData) => {
          const { createData } = resolveData
          const { queryObj } = parseRequest(createData.request)
          // 只对 mpxCustomElement 做拦截处理
          if (queryObj.mpx && queryObj.extract && queryObj.mpxCustomElement && queryObj.mpxCustomElement !== MPX_PROCESSED_FLAG) {
            // 重新构造 loaders 数组
            createData.loaders = [{
              loader: loader
            }]

            createData.resource = addQuery(createData.resource, { mpxCustomElement: MPX_PROCESSED_FLAG }, true)
            createData.request = stringifyLoadersAndResource(createData.loaders, createData.resource)
          }
        })
      }
    })
  }
}
