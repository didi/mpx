const postcss = require('postcss')
const selectorParser = require('postcss-selector-parser')
const getRulesRunner = require('../platform/index')
const dash2hump = require('../utils/hump-dash').dash2hump
const rpxRegExp = /^\s*(\d+(\.\d+)?)rpx\s*$/
const pxRegExp = /^\s*(\d+(\.\d+)?)(px)?\s*$/

function getClassMap ({ content, filename, mode, srcMode, warn, error }) {
  const classMap = {}
  
  const root = postcss.parse(content, {
    from: filename
  })
  
  function _warn (msg) {
    console.warn(('[style compiler warn]: ' + msg))
  }
  
  function _error (msg) {
    console.error(('[style compiler error]: ' + msg))
  }
  const rulesRunner = getRulesRunner({
    mode,
    srcMode,
    type: 'style',
    testKey: 'prop',
    warn: (msg) => {
      console.warn('[style compiler warn]: ' + msg)
    },
    error: (msg) => {
      console.error('[style compiler error]: ' + msg)
    }
  })
  root.walkRules(rule => {
    const classMapValue = {}
    rule.walkDecls(({ prop, value }) => {
      let newData = rulesRunner({ prop, value })
      if (!newData.length) {
        newData = [newData]
      }
      newData.forEach(item => {
        // todo 检测不支持的value
        value = item.value
        // todo 检测不支持的prop
        prop = dash2hump(item.prop)
        let matched
        let needStringify = true
        if ((matched = pxRegExp.exec(value))) {
          value = matched[1]
          needStringify = false
        } else if ((matched = rpxRegExp.exec(value))) {
          value = `this.__rpx(${matched[1]})`
          needStringify = false
        }
        classMapValue[prop] = needStringify ? JSON.stringify(value) : value
      })
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
