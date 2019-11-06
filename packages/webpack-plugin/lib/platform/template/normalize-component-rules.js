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
        el.attrsList.forEach((attr) => {
          const meta = {}
          let rAttr = runRules(spec.preAttrs, attr, {
            mode,
            testKey,
            data
          })
          rAttr = runRules(spec.directive, rAttr, {
            mode,
            testKey,
            data,
            meta
          })
          if (!meta.processed) {
            rAttr = runRules(cfg.props, rAttr, {
              mode,
              testKey,
              data
            })
          }
          if (Array.isArray(rAttr)) {
            rAttrsList = rAttrsList.concat(rAttr)
          } else if (rAttr === false) {
            // delete original attr
          } else {
            rAttrsList.push(rAttr)
          }
        })
        rAttrsList = rAttrsList.map((attr) => {
          return runRules(spec.postAttrs, attr, {
            mode,
            testKey,
            data
          })
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
