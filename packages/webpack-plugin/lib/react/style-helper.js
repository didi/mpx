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
  
  function formatValue(value) {
    let matched
    let needStringify = true
    if ((matched = pxRegExp.exec(value))) {
      value = matched[1]
      needStringify = false
    } else if ((matched = rpxRegExp.exec(value))) {
      value = `this.__rpx(${matched[1]})`
      needStringify = false
    }
    return needStringify ? JSON.stringify(value) : value
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
        prop = dash2hump(item.prop)
        value = item.value
        if (typeof item.value === 'object') {
          for (const key in item.value) {
            item.value[key] = formatValue(item.value[key])
          }
        } else {
          value = formatValue(value)
        }
        classMapValue[prop] = value
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
