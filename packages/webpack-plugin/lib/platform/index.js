const runRules = require('./run-rules')

/**
 * 第一阶段先支持模板上的directive/event/rules外部传入，通过副作用直接修改
 * @param {object} baseSpecMap 基准specMap
 * @param {object} extendSpecMap 扩展specMap
 * @return {object} 返回扩展后的specMap
 */
function mergeSpecMapRules (baseSpecMap, extendSpecMap) {
  const extendWXTemplate = extendSpecMap && extendSpecMap.template && extendSpecMap.template.wx
  if (extendWXTemplate) {
    const { rules, directive, event } = extendWXTemplate
    // todo：更好的merge规则，因为命中一条后不会再走后续，所以目前这样会导致组件/指令/事件级别的规则彻底覆盖内建规则，而不是合并
    if (Array.isArray(rules)) {
      baseSpecMap.template.wx.rules.unshift(...rules)
    }
    if (Array.isArray(directive)) {
      baseSpecMap.template.wx.directive.unshift(...directive)
    }
    if (Array.isArray(event)) {
      baseSpecMap.template.wx.event.unshift(...event)
    }
  }
  return baseSpecMap
}

/**
 * 获取带内置规则的转换执行器，
 * @param type 转换类型 目前有模板template和json两种
 * @param {'wx'|'ali'|'swan'|'qq'|'tt'|'web'} mode 当前模式 可选值 wx/ali/swan/qq/tt/web
 * @param {'wx'} srcMode 源码模式 目前仅支持微信
 * @param data
 * @param {object} meta 记录一些前面处理的元信息，比如说某个输入有没有经过转换函数处理
 * @param testKey 存在时取input[testKey]作为testInput
 * @param mainKey json中针对page/component区分处理
 * @param {boolean=} waterfall 是否使用瀑布流式处理
 * @param {function} warn 警告方法，对于不严重的通过警告报出
 * @param {function} error 错误方法，对于严重的通过错误报出
 * @param {object} customTransSpec 自定义转换规则，允许外部定义
 * @return {function(*=): *} 转换执行器
 */
module.exports = function getRulesRunner ({ type, mode, srcMode, data, meta, testKey, mainKey, waterfall, warn, error, customTransSpec }) {
  const builtInSpecMap = {
    template: {
      wx: require('./template/wx')({ warn, error })
    },
    json: {
      wx: require('./json/wx')({ warn, error })
    }
  }
  const specMap = mergeSpecMapRules(builtInSpecMap, customTransSpec)
  const spec = specMap[type] && specMap[type][srcMode]
  if (spec && spec.supportedModes.indexOf(mode) > -1) {
    const normalizeTest = spec.normalizeTest
    const mainRules = mainKey ? spec[mainKey] : spec
    if (mainRules) {
      return function (input) {
        return runRules(mainRules, input, { mode, data, meta, testKey, waterfall, normalizeTest })
      }
    }
  }
}
