const runRules = require('./run-rules')

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
  const specMap = {
    template: {
      wx: require('./template/wx')({ warn, error, customTransSpec })
    },
    json: {
      wx: require('./json/wx')({ warn, error })
    }
  }
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
