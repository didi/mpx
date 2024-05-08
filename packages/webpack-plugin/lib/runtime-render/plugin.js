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
            baseComponents: {
              block: {}
            },
            runtimeComponents: {},
            normalComponents: {}
          }

          const runtimeInfoJson = mpx.runtimeInfoJson[packageName] || {}

          for (const resourcePath in mpx.runtimeInfoTemplate[packageName]) {
            const { customComponents = {}, baseComponents = {} } = mpx.runtimeInfoTemplate[packageName][resourcePath]
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
              // todo：本地开发阶段可以加上方便查看组件名
              // ast.aliasTag = componentInfo.hashName
              if (componentInfo.isDynamic) {
                ast.dynamic = true
              }
            } else { // 基础节点的优化
              // const attrs = ast.attrsList || []
              // const { nodeType } = getOptimizedComponentInfo({
              //   nodeType: ast.tag,
              //   attrs: attrs.map((item) => item.name)
              // })
              // ast.tag = nodeType
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
      }
    })
  }
}
