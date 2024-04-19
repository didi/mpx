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
        mpx.runtimeInfoJson = {}
        mpx.runtimeInfoTemplate = {}

        // 注入到 mpx-custom-element-*.json 里面的组件路径
        mpx.getPackageInjectedComponentsMapNew = function (packageName = 'main') {
          const res = {}
          const runtimeInfoJson = mpx.runtimeInfoJson[packageName] || {}
          const componentsMap = mpx.componentsMap[packageName] || {}
          const publicPath = compilation.outputOptions.publicPath || ''
          for (const componentPath in runtimeInfoJson) {
            Object.values(runtimeInfoJson[componentPath]).forEach(({ hashName, resourcePath }) => {
              const outputPath = componentsMap[resourcePath]
              if (outputPath) {
                res[hashName] = publicPath + outputPath
              }
            })
          }
          return res
        }

        mpx.getPackageInjectedTemplateConfig = function (packageName = 'main') {
          const res = {
            internalComponents: {
              block: {}
            },
            runtimeComponents: {},
            normalComponents: {}
          }

          const runtimeInfoJson = mpx.runtimeInfoJson[packageName] || {}

          for (const resourcePath in mpx.runtimeInfoTemplate[packageName]) {
            const { customComponents = {}, internalComponents = {}} = mpx.runtimeInfoTemplate[packageName][resourcePath]
            const componentsJsonConfig = runtimeInfoJson[resourcePath]

            // 合并自定义组件的属性
            for (const componentName in customComponents) {
              const extraAttrs = {}
              const attrsMap = customComponents[componentName]
              const { hashName, isDynamic } = componentsJsonConfig[componentName] || {}
              let componentType = 'normalComponents'
              if (isDynamic) {
                componentType = 'runtimeComponents'
                extraAttrs.slots = ''
              }
              if (!res[componentType][hashName]) {
                res[componentType][hashName] = {}
              }

              Object.assign(res[componentType][hashName], {
                ...attrsMap,
                ...extraAttrs
              })
            }

            // 合并基础节点的属性
            for (const componentName in internalComponents) {
              const attrsMap = internalComponents[componentName]
              if (!res.internalComponents[componentName]) {
                res.internalComponents[componentName] = {}
              }
              Object.assign(res.internalComponents[componentName], attrsMap)
            }
          }

          return res
        }

        mpx.changeHashNameForAstNode = function (ast, packageName, resourcePath) {
          const runtimeInfoJson = mpx.runtimeInfoJson[packageName] || {}
          const componentsMap = runtimeInfoJson[resourcePath] || {}

          const iterateAst = (ast = {}) => {
            if (typeof ast !== 'object') {
              return
            }
            const componentInfo = componentsMap[ast.tag]
            if (componentInfo) {
              ast.aliasTag = componentInfo.hashName
              if (componentInfo.isDynamic) {
                ast.dynamic = true
              }
            }
            // todo 后续看优化情况，simplify 阶段到底是在 template-compiler 还是在这个阶段做
            if (ast.children) {
              ast.children.forEach(child => iterateAst(child))
            }
            if (ast.ifConditions) {
              ast.ifConditions.forEach(child => iterateAst(child.block))
            }
          }

          iterateAst(ast)

          return ast
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
      }
    })
  }
}
