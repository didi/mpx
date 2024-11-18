const runRules = require('../run-rules')

/**
 * @desc 针对每一个组件(属性，event，指令等)执行规则判断
 * @params cfgs [{test: 'camera', props:[], event: []}] 组件配置列表
 * @params spec ../index.js中公共的spec
 */
module.exports = function normalizeComponentRules (cfgs, spec) {
  return cfgs.map((cfg) => {
    const result = {}
    if (cfg.test) result.test = cfg.test
    if (cfg.waterfall) result.waterfall = cfg.waterfall
    const supportedModes = cfg.supportedModes || spec.supportedModes
    // 合并component-config中组件的event 与index中公共的event规则
    const eventRules = (cfg.event || []).concat(spec.event.rules)
    supportedModes.forEach((mode) => {
      result[mode] = cfg.skipNormalize
        ? cfg[mode]
        : function (el, data) {
          data = Object.assign({}, data, { el, eventRules })
          const testKey = 'name'
          let rAttrsList = []
          const options = {
            mode,
            testKey,
            data
          }
          el.attrsList.forEach((attr) => {
            const meta = {}
            let rAttr = runRules(spec.directive, attr, {
              ...options,
              meta
            })
            // 指令未匹配到时说明为props，因为目前所有的指令都需要转换
            if (!meta.processed) {
              rAttr = runRules(spec.preProps, rAttr, options)
              rAttr = runRules(cfg.props, rAttr, options)
              if (Array.isArray(rAttr)) {
                rAttr = rAttr.map((attr) => {
                  return runRules(spec.postProps, attr, options)
                })
              } else if (rAttr !== false) {
                rAttr = runRules(spec.postProps, rAttr, options)
              }
            }
            // 生成目标attrsList
            if (Array.isArray(rAttr)) {
              rAttrsList = rAttrsList.concat(rAttr)
            } else if (rAttr !== false) {
              rAttrsList.push(rAttr)
            }
          })
          el.attrsList = rAttrsList
          el.attrsMap = require('../../template-compiler/compiler').makeAttrsMap(rAttrsList)
          // 前置处理attrs,便于携带信息用于tag的处理
          const rTag = cfg[mode] && cfg[mode].call(this, el.tag, data)
          if (rTag) {
            el.tag = rTag
          }
          return el
        }
    })
    return result
  })
}
