const postcss = require('postcss')
const selectorParser = require('postcss-selector-parser')
const dash2hump = require('../utils/hump-dash').dash2hump
const rpxRegExp = /^\s*(\d+(\.\d+)?)rpx\s*$/
const pxRegExp = /^\s*(\d+(\.\d+)?)(px)?\s*$/

function getStyleObj (content, filename) {
  const styleObj = {}
  const root = postcss.parse(content, {
    from: filename
  })
  root.walkRules(rule => {
    const styleObjValue = {}
    rule.walkDecls(({ prop, value }) => {
      // todo 检测不支持的prop
      prop = dash2hump(prop)
      let matched
      let needStringify = true
      if ((matched = pxRegExp.exec(value))) {
        value = matched[1]
        needStringify = false
      } else if ((matched = rpxRegExp.exec(value))) {
        value = `rpx(${matched[1]})`
        needStringify = false
      }
      // todo 检测不支持的value
      styleObjValue[prop] = needStringify ? JSON.stringify(value) : value
    })

    const styleObjKeys = []

    selectorParser(selectors => {
      selectors.each(selector => {
        if (selector.nodes.length === 1 && selector.nodes[0].type === 'class') {
          styleObjKeys.push(selector.nodes[0].value)
        } else {
          rule.error('Only single class selector is supported in react native mode temporarily.')
        }
      })
    }).processSync(rule.selector)

    if (styleObjKeys.length) {
      styleObjKeys.forEach((key) => {
        styleObj[key] = Object.assign(styleObj[key] || {}, styleObjValue)
      })
    }
  })
  return styleObj
}

module.exports = {
  getStyleObj
}
