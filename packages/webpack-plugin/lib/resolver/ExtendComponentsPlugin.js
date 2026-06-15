const path = require('path')
const toPosix = require('../utils/to-posix')
const EXTEND_COMPONENT_PATH_REGEXP = /\/lib\/runtime\/components\/extends\//
const EXTEND_COMPONENT_TARGET_SUB_PATH = 'lib/runtime/components/react/dist/'
const EXTEND_COMPONENTS = {
  'section-list': ['ios', 'android', 'harmony']
}

/**
 * 扩展组件路径解析插件
 * 将 @mpxjs/webpack-plugin/lib/runtime/components/extends/[component-name] 格式的路径
 * 解析为对应平台的实际组件路径
 */
module.exports = class ExtendComponentsPlugin {
  constructor (source, mode, target, compiler) {
    this.source = source
    this.target = target
    this.mode = mode
    this.currentCompilation = null
    compiler.hooks.thisCompilation.tap('ExtendComponentsPlugin', (compilation) => {
      this.currentCompilation = compilation
    })
  }

  apply (resolver) {
    const target = resolver.ensureHook(this.target)
    const mode = this.mode

    const pushError = (err) => {
      if (this.currentCompilation) {
        this.currentCompilation.errors.push(err)
      }
    }

    resolver.getHook(this.source).tapAsync('ExtendComponentsPlugin', (request, resolveContext, callback) => {
      if (request.__mpxResolvedExtendComponent) return callback()

      const componentName = getComponentName(request)
      if (!componentName) {
        return callback()
      }

      // 检查组件是否在配置中
      const supportedModes = EXTEND_COMPONENTS[componentName]
      if (!supportedModes) {
        pushError(new Error(`Extended component "${componentName}" was not found. Available extended components: ${Object.keys(EXTEND_COMPONENTS).join(', ')}`))
        return callback()
      }

      // 获取当前模式下的组件路径
      if (!supportedModes.includes(mode)) {
        pushError(new Error(`Extended component "${componentName}" cannot be used on the ${mode} platform. Supported platforms include: ${supportedModes.join(', ')}`))
        return callback()
      }
      const targetSubPath = `${EXTEND_COMPONENT_TARGET_SUB_PATH}mpx-${componentName}.jsx`
      const targetRelativePath = `./${targetSubPath}`
      const targetPath = path.join(request.descriptionFileRoot, targetSubPath)

      const redirectRequest = Object.assign({}, request, {
        path: targetPath,
        relativePath: targetRelativePath,
        __mpxResolvedExtendComponent: true
      })

      resolver.doResolve(
        target,
        redirectRequest,
        `resolve extend component: ${componentName} to ${targetPath}`,
        resolveContext,
        (err, result) => {
          if (err) {
            pushError(err)
            return callback()
          }
          if (!result) {
            pushError(new Error(`Extended component "${componentName}" resolved to "${targetPath}", but the target file was not found.`))
            return callback()
          }
          callback(null, result)
        }
      )
    })
  }
}

function getComponentName (request) {
  if (!request.path) return
  const requestPath = toPosix(request.path)
  if (!EXTEND_COMPONENT_PATH_REGEXP.test(requestPath)) return
  return path.basename(requestPath, path.extname(requestPath))
}
