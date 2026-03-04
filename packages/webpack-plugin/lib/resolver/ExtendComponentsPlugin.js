const { EXTEND_COMPONENT_CONFIG } = require('../utils/const')

/**
 * 扩展组件路径解析插件
 * 将 @mpxjs/webpack-plugin/lib/runtime/components/extends/[component-name] 格式的路径
 * 解析为对应平台的实际组件路径
 */
module.exports = class ExtendComponentsPlugin {
  constructor (source, mode, target) {
    this.source = source
    this.target = target
    this.mode = mode
  }

  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    const mode = this.mode

    resolver.getHook(this.source).tapAsync('ExtendComponentsPlugin', (request, resolveContext, callback) => {
      const requestPath = request.request
      if (!requestPath || !requestPath.startsWith('@mpxjs/webpack-plugin/lib/runtime/components/extends/')) {
        return callback()
      }

      // 匹配 @mpxjs/webpack-plugin/lib/runtime/components/extends/[component-name]
      const extendsMatch = requestPath.match(/^@mpxjs\/webpack-plugin\/lib\/runtime\/components\/extends\/(.+)$/)

      if (!extendsMatch) {
        return callback()
      }

      const componentName = extendsMatch[1]

      // 检查组件是否在配置中
      if (!EXTEND_COMPONENT_CONFIG[componentName]) {
        return callback(new Error(`Extended component "${componentName}" was not found. Available extended components: ${Object.keys(EXTEND_COMPONENT_CONFIG).join(', ')}`))
      }

      // 获取当前模式下的组件路径
      const componentConfig = EXTEND_COMPONENT_CONFIG[componentName]
      const newRequest = componentConfig[mode]

      if (!newRequest) {
        return callback(new Error(`Extended component "${componentName}" cannot be used on the ${mode} platform. Supported platforms include: ${Object.keys(componentConfig).join(', ')}`))
      }

      const obj = Object.assign({}, request, {
        request: newRequest
      })

      resolver.doResolve(
        target,
        obj,
        `resolve extend component: ${componentName} to ${newRequest}`,
        resolveContext,
        callback
      )
    })
  }
}
