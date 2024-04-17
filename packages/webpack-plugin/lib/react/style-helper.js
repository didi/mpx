const postcss = require('postcss')
const selectorParser = require('postcss-selector-parser')
const getRulesRunner = require('../platform/index')
const dash2hump = require('../utils/hump-dash').dash2hump
const rpxRegExp = /^\s*(\d+(\.\d+)?)rpx\s*$/
const pxRegExp = /^\s*(\d+(\.\d+)?)(px)?\s*$/

function baseWarn (msg) {
  console.warn(('[style compiler warn]: ' + msg))
}

function baseError (msg) {
  console.error(('[style compiler error]: ' + msg))
}

function getClassMap ({ content, filename, mode, srcMode, warn, error }) {
  const classMap = {}
  const rulesResultMap = new Map()
  warn$1 = warn || baseWarn
  error$1 = error || baseError
  
  const _warn = ({ prop, content }) => {
    const currentPropRuleResult = rulesResultMap.get(prop) || rulesResultMap.set(prop, {
      warnArray: [],
      errorArray: []
    }).get(prop)
    currentPropRuleResult.warnArray.push(content)
  }
  
  const _error = ({ prop, content }) => {
    const currentPropRuleResult = rulesResultMap.get(prop) || rulesResultMap.set(prop, {
      warnArray: [],
      errorArray: []
    }).get(prop)
    currentPropRuleResult.errorArray.push(content)
  }
  
  const root = postcss.parse(content, {
    from: filename
  })
  const rulesRunner = getRulesRunner({
    mode,
    srcMode,
    type: 'style',
    testKey: 'prop',
    warn: _warn,
    error: _error
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
    
    rulesResultMap.forEach((val) => {
      Array.isArray(val.warnArray) && val.warnArray.forEach(item => warn$1(item))
      Array.isArray(val.errorArray) && val.errorArray.forEach(item => error$1(item))
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
