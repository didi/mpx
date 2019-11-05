const runRules = require('../run-rules')

module.exports = function normalizeComponentRules (cfgs, spec) {
  return cfgs.map((cfg) => {
    const result = {}
    if (cfg.test) {
      result.test = cfg.test
    }
    const supportedTargets = cfg.supportedTargets || spec.supportedTargets
    const eventRules = (cfg.event || []).concat(spec.event.rules)
    supportedTargets.forEach((target) => {
      result[target] = function (el, data) {
        data = Object.assign({}, data, { el, eventRules })
        const rTag = cfg[target] && cfg[target].call(this, el.tag, data)
        if (rTag) {
          el.tag = rTag
        }
        const rAttrsList = []
        el.attrsList.forEach((attr) => {
          const testKey = 'name'
          let rAttr = runRules(spec.directive, attr, {
            target,
            testKey,
            data
          })
          if (rAttr === undefined) {
            rAttr = runRules(cfg.props, attr, {
              target,
              testKey,
              data
            })
          }
          if (Array.isArray(rAttr)) {
            rAttrsList.push(...rAttr)
          } else if (rAttr === false) {
            // delete original attr
          } else {
            rAttrsList.push(rAttr || attr)
          }
        })
        el.attrsList = rAttrsList
        el.attrsMap = require('../../template-compiler/compiler').makeAttrsMap(rAttrsList)
        return el
      }
    })
    return result
  })
}
