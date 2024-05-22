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
        mpx.runtimeInfoJson = {}
        mpx.runtimeInfoTemplate = {}
        // 运行时组件依赖的运行时组件当中使用的基础组件 slot
        mpx.dynamicSlotDependencies = {}

        // 注入到 mpx-custom-element-*.json 里面的组件路径
        mpx.getPackageInjectedComponentsMap = function (packageName = 'main') {
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
            baseComponents: {
              block: {}
            },
            runtimeComponents: {},
            normalComponents: {}
          }

          const componentsMap = mpx.componentsMap[packageName] || {}
          const publicPath = compilation.outputOptions.publicPath || ''
          const runtimeInfoJson = mpx.runtimeInfoJson[packageName] || {}

          // 包含了某个分包当中所有的运行时组件
          for (const resourcePath in mpx.runtimeInfoTemplate[packageName]) {
            const {
              customComponents = {},
              baseComponents = {},
              dynamicSlotDependencies = {}
            } = mpx.runtimeInfoTemplate[packageName][resourcePath]
            const componentsJsonConfig = runtimeInfoJson[resourcePath]

            // 满足运行时组件里面存在基础组件的情况
            for (const componentName in dynamicSlotDependencies) {
              const { resourcePath, isDynamic } = componentsJsonConfig[componentName] || {}
              if (isDynamic) {
                dynamicSlotDependencies[componentName].forEach(name => {
                  const { resourcePath: path, isDynamic, hashName } = componentsJsonConfig[name]
                  if (!isDynamic) {
                    // 运行时组件依赖运行时的组件使用了 slot 普通组件才会被收集
                    mpx.collectDynamicSlotDependencies(resourcePath, {
                      [hashName]: publicPath + componentsMap[path]
                    })
                  }
                })
              }
            }

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
            for (const componentName in baseComponents) {
              const attrsMap = baseComponents[componentName]
              if (!res.baseComponents[componentName]) {
                res.baseComponents[componentName] = {}
              }
              Object.assign(res.baseComponents[componentName], attrsMap)
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
            if (componentInfo) { // 自定义节点替换 hashName
              ast.tag = componentInfo.hashName
              if (componentInfo.isDynamic) {
                ast.dynamic = true
              }
            }
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

        mpx.collectDynamicSlotDependencies = function (resourcePath, extraUsingComponents) {
          mpx.dynamicSlotDependencies[resourcePath] = mpx.dynamicSlotDependencies[resourcePath] || {}
          Object.assign(mpx.dynamicSlotDependencies[resourcePath], extraUsingComponents)
        }
      }
    })
  }
}
