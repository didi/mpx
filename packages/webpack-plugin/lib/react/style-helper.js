const postcss = require('postcss')
const selectorParser = require('postcss-selector-parser')
const dash2hump = require('../utils/hump-dash').dash2hump
const rpxRegExp = /^\s*(\d+(\.\d+)?)rpx\s*$/
const pxRegExp = /^\s*(\d+(\.\d+)?)(px)?\s*$/

function getClassMap (content, filename) {
  const classMap = {}
  const root = postcss.parse(content, {
    from: filename
  })
  root.walkRules(rule => {
    const classMapValue = {}
    rule.walkDecls(({ prop, value }) => {
      // todo 检测不支持的prop
      prop = dash2hump(prop)
      let matched
      let needStringify = true
      if ((matched = pxRegExp.exec(value))) {
        value = matched[1]
        needStringify = false
      } else if ((matched = rpxRegExp.exec(value))) {
        value = `this.__rpx(${matched[1]})`
        needStringify = false
      }
      // todo 检测不支持的value
      classMapValue[prop] = needStringify ? JSON.stringify(value) : value
    })

    const classMapKeys = []

    selectorParser(selectors => {
      selectors.each(selector => {
        if (selector.nodes.length === 1 && selector.nodes[0].type === 'class') {
          classMapKeys.push(selector.nodes[0].value)
        } else {
          rule.error('Only single class selector is supported in react native mode temporarily.')
        }
      })
    }).processSync(rule.selector)

    if (classMapKeys.length) {
      classMapKeys.forEach((key) => {
        classMap[key] = Object.assign(classMap[key] || {}, classMapValue)
      })
    }
  })
  return classMap
}

module.exports = {
  getClassMap
}
