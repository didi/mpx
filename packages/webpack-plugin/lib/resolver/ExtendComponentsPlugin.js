const path = require('path')
const toPosix = require('../utils/to-posix')
const EXTEND_COMPONENT_PATH_REGEXP = /@mpxjs\/webpack-plugin\/lib\/runtime\/components\/extends\/[^/]+$/
const RN_SECTION_LIST_TARGET = path.resolve(__dirname, '../runtime/components/react/dist/mpx-section-list.jsx')
const EXTEND_COMPONENTS = {
  'section-list': {
    ios: RN_SECTION_LIST_TARGET,
    android: RN_SECTION_LIST_TARGET,
    harmony: RN_SECTION_LIST_TARGET
  }
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
      const componentTargetMap = EXTEND_COMPONENTS[componentName]
      if (!componentTargetMap) {
        pushError(new Error(`Extended component "${componentName}" was not found. Available extended components: ${Object.keys(EXTEND_COMPONENTS).join(', ')}`))
        return callback()
      }

      // 获取当前模式下的组件路径
      const targetPath = componentTargetMap[mode]
      if (!targetPath) {
        pushError(new Error(`Extended component "${componentName}" cannot be used on the ${mode} platform. Supported platforms include: ${Object.keys(componentTargetMap).join(', ')}`))
        return callback()
      }

      const redirectRequest = Object.assign({}, request, {
        path: targetPath,
        relativePath: undefined,
        __mpxResolvedExtendComponent: true
      })

      resolver.doResolve(
        target,
        redirectRequest,
        `resolve extend component: ${componentName} to ${targetPath}`,
        resolveContext,
        callback
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
