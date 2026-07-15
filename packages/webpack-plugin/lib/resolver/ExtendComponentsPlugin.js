const path = require('path')
const toPosix = require('../utils/to-posix')
const EXTEND_COMPONENT_PATH_REGEXP = /@mpxjs\/webpack-plugin\/lib\/runtime\/components\/extends\/[^/]+$/
const RN_COMPONENTS_DIST_PATH = 'lib/runtime/components/react/dist'
const EXTEND_COMPONENTS = {
  'section-list': {
    ios: `${RN_COMPONENTS_DIST_PATH}/mpx-section-list.jsx`,
    android: `${RN_COMPONENTS_DIST_PATH}/mpx-section-list.jsx`,
    harmony: `${RN_COMPONENTS_DIST_PATH}/mpx-section-list.jsx`
  }
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
      if (request.__mpxResolvedExtendComponent) return callback()

      const componentName = getComponentName(request)
      if (!componentName) {
        return callback()
      }

      // 检查组件是否在配置中
      const componentTargetMap = EXTEND_COMPONENTS[componentName]
      const targetSubPath = componentTargetMap && componentTargetMap[mode]
      if (!targetSubPath) {
        return callback(new Error(`Extended component "${componentName}" cannot be used on the ${mode} platform.`))
      }
      const targetPath = path.join(request.descriptionFileRoot, targetSubPath)
      const targetRelativePath = `./${targetSubPath}`

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
