const { EXTEND_COMPONENT_CONFIG } = require('./const')
const normalize = require('./normalize')

/**
 * 处理扩展组件的公共方法
 * @param {Object} options 配置选项
 * @param {Object} options.useExtendComponents 使用的扩展组件配置
 * @param {string} options.mode 当前模式 (wx, ali, web, rn 等)
 * @param {Function} options.emitWarning 警告函数
 * @returns {Object} 扩展组件映射对象
 */
function processExtendComponents (options) {
  const {
    useExtendComponents = {},
    mode,
    emitWarning
  } = options

  if (!useExtendComponents[mode]) {
    return {}
  }

  const extendComponents = {}

  useExtendComponents[mode].forEach((name) => {
    // 从配置中获取该组件在当前平台的具体路径
    const componentConfig = EXTEND_COMPONENT_CONFIG[name]

    if (componentConfig && componentConfig[mode]) {
      extendComponents[name] = normalize.lib(componentConfig[mode])
    } else if (componentConfig) {
      emitWarning('extend component ' + name + ' is not configured for ' + mode + ' environment!')
    } else {
      emitWarning('extend component ' + name + ' is not supported in any environment!')
    }
  })

  return extendComponents
}

module.exports = {
  processExtendComponents
}
