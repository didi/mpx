const runRules = require('../run-rules')

module.exports = function normalizeComponentRules (cfgs, spec) {
  return cfgs.map((cfg) => {
    const result = {}
    if (cfg.test) {
      result.test = cfg.test
    }
    const supportedModes = cfg.supportedModes || spec.supportedModes
    const eventRules = (cfg.event || []).concat(spec.event.rules)
    supportedModes.forEach((mode) => {
      result[mode] = function (el, data) {
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
          let rAttr = runRules(spec.preAttrs, attr, options)
          rAttr = runRules(spec.directive, rAttr, {
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
