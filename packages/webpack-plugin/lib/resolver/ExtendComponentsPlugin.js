const toPosix = require('../utils/to-posix')
const EXTEND_COMPONENT_RELATIVE_PATH = './lib/runtime/components/extends/'
const EXTEND_COMPONENT_TARGET_PATH = '@mpxjs/webpack-plugin/lib/runtime/components/react/dist'
const EXTEND_COMPONENTS = {
  'section-list': ['ios', 'android', 'harmony']
}

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
      const componentName = getComponentName(request)
      if (!componentName) {
        return callback()
      }

      // 检查组件是否在配置中
      const supportedModes = EXTEND_COMPONENTS[componentName]
      if (!supportedModes) {
        return callback(new Error(`Extended component "${componentName}" was not found. Available extended components: ${Object.keys(EXTEND_COMPONENTS).join(', ')}`))
      }

      // 获取当前模式下的组件路径
      if (!supportedModes.includes(mode)) {
        return callback(new Error(`Extended component "${componentName}" cannot be used on the ${mode} platform. Supported platforms include: ${supportedModes.join(', ')}`))
      }
      const newRequest = `${EXTEND_COMPONENT_TARGET_PATH}/mpx-${componentName}.jsx`

      const redirectRequest = Object.assign({}, request, {
        request: newRequest,
        fullySpecified: false,
        __mpxResolvedExtendComponent: true
      })

      resolver.doResolve(
        target,
        redirectRequest,
        `resolve extend component: ${componentName} to ${newRequest}`,
        resolveContext,
        (err, result) => {
          if (err) return callback(err)
          if (!result) return callback(new Error(`Extended component "${componentName}" resolved to "${newRequest}", but the target file was not found.`))
          callback(null, result)
        }
      )
    })
  }
}

function getComponentName (request) {
  const descriptionFileData = request.descriptionFileData
  const relativePath = request.relativePath && toPosix(request.relativePath)

  if (!descriptionFileData || descriptionFileData.name !== '@mpxjs/webpack-plugin' || !relativePath || !relativePath.startsWith(EXTEND_COMPONENT_RELATIVE_PATH)) return

  return relativePath.slice(EXTEND_COMPONENT_RELATIVE_PATH.length).replace(/\.[^/.]+$/, '')
}
