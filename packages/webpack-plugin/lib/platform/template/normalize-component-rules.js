const runRules = require('../run-rules')

module.exports = function normalizeComponentRules (cfgs, spec) {
  return cfgs.map((cfg) => {
    const result = {}
    if (cfg.test) {
      result.test = cfg.test
    }
    spec.supportedTargets.forEach((target) => {
      result[target] = function (el) {
        const rTag = cfg[target] && cfg[target].call(this, el.tag)
        if (rTag) {
          el.tag = rTag
        }
        const rAttrsList = []
        const eventRules = (cfg.event || []).concat(spec.event.rules)
        el.attrsList.forEach((attr) => {
          const testKey = 'name'
          const rAttr = runRules(spec.directive, attr, {
            target,
            testKey,
            data: {
              eventRules,
              attrsMap: el.attrsMap
            }
          }) || runRules(cfg.props, attr, {
            target,
            testKey,
            data: {
              attrsMap: el.attrsMap
            }
          })
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
