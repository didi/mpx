const postcss = require('postcss')
const selectorParser = require('postcss-selector-parser')
const { MPX_TAG_PAGE_SELECTOR } = require('../utils/const')
const getRulesRunner = require('../platform/index')
const dash2hump = require('../utils/hump-dash').dash2hump
const parseValues = require('../utils/string').parseValues
const unitRegExp = /^\s*(-?\d+(?:\.\d+)?)(rpx|vw|vh|px)?\s*$/
const hairlineRegExp = /^\s*hairlineWidth\s*$/
const varRegExp = /^--/
const cssPrefixExp = /^-(webkit|moz|ms|o)-/
function getClassMap ({ content, filename, mode, srcMode, ctorType, warn, error }) {
  const classMap = ctorType === 'page'
      ? {
          [MPX_TAG_PAGE_SELECTOR]: {
            _media: [],
            _default: { flex: 1, height: "'100%'" }
          }
        }
      : {}

  const root = postcss.parse(content, {
    from: filename
  })

  function formatValue (value) {
    let needStringify = true
    const matched = unitRegExp.exec(value)
    if (matched) {
      if (!matched[2] || matched[2] === 'px') {
        value = matched[1]
        needStringify = false
      } else {
        value = `global.__formatValue(${+matched[1]}, '${matched[2]}')`
        needStringify = false
      }
    }
    if (hairlineRegExp.test(value)) {
      value = `global.__formatValue(${JSON.stringify(value)}, 'hairlineWidth')`
      needStringify = false
    }
    return needStringify ? JSON.stringify(value) : value
  }

  function getMediaOptions (params) {
    return parseValues(params).reduce((option, item) => {
      if (['all', 'print'].includes(item)) {
        error(`Media type only support [screen], received ${item}, please check again!`)
        return option
      }
      if (['not', 'only', 'or', ','].includes(item)) {
        error(`Media logical operator only support [and], received ${item}, please check again!`)
        return option
      }
      const bracketsExp = /\((.+?)\)/
      if (bracketsExp.test(item)) {
        const mediaFeatureStr = item.match(bracketsExp)?.[1] || ''
        // console.log(mediaFeatureStr, 999111)
        const range = parseValues(mediaFeatureStr, ':')
        if (range.length < 2) {
          return option
        } else {
          const mediaFeature = dash2hump(range[0])
          if (mediaFeature === 'maxWidth' || mediaFeature === 'minWidth') {
            option[mediaFeature] = +formatValue(range[1])
          } else {
            error(`Media feature only support [width], received [${mediaFeatureStr}], please check again!`)
            return option
          }
        }
      }
      return option
    }, {})
  }

  const rulesRunner = getRulesRunner({
    mode,
    srcMode,
    type: 'style',
    testKey: 'prop',
    warn,
    error
  })

  function walkRule ({ rule, classMap, ruleName = '', options }) {
    const classMapValue = {}
    rule.walkDecls(({ prop, value }) => {
      if (cssPrefixExp.test(prop) || cssPrefixExp.test(value)) return
      let newData = rulesRunner({ prop, value, selector: rule.selector })
      if (!newData) return
      if (!Array.isArray(newData)) {
        newData = [newData]
      }
      newData.forEach(item => {
        prop = varRegExp.test(item.prop) ? item.prop : dash2hump(item.prop)
        value = item.value
        if (Array.isArray(value)) {
          value = value.map(val => {
            if (typeof val === 'object') {
              for (const key in val) {
                val[key] = formatValue(val[key])
              }
              return val
            } else {
              return formatValue(val)
            }
          })
        } else if (typeof value === 'object') {
          for (const key in value) {
            value[key] = formatValue(value[key])
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
        if (selector.nodes.length === 1 && (selector.nodes[0].type === 'class' || (ruleName === 'keyframes' && selector.nodes[0].type === 'tag'))) {
          classMapKeys.push(selector.nodes[0].value)
        } else {
          error('Only single class selector is supported in react native mode temporarily.')
        }
      })
    }).processSync(rule.selector)

    if (classMapKeys.length) {
      classMapKeys.forEach((key) => {
        if (key === 'from') key = '0%'
        if (key === 'to') key = '100%'
        if (Object.keys(classMapValue).length) {
          const _default = classMap[key]?._default || {}
          const _media = classMap[key]?._media || []
          if (ruleName === 'media' && (options.minWidth || options.maxWidth)) {
            _media.push({
              options,
              value: classMapValue
            })
          } else {
            Object.assign(_default, classMapValue)
          }
          classMap[key] = {
            _media,
            _default
          }
        }
      })
    }
  }
  // 目前所有 AtRule 只支持 @media & @keyframes，其他全部给出错误提示
  root.walkAtRules(rule => {
    if (rule.name !== 'media' && rule.name !== 'keyframes') {
      warn(`Only @media and @keyframes rules is supported in react native mode temporarily, but got @${rule.name}`)
      return
    }
    const ruleName = rule.name
    const ruleClassMap = ruleName === 'keyframes' ? {} : classMap
    rule.walkRules(node => {
      const options = ruleName === 'media' ? getMediaOptions(rule.params) : null
      walkRule({
        rule: node,
        ruleName,
        options,
        classMap: ruleClassMap
      })
    })
    if (ruleName === 'keyframes' && Object.keys(ruleClassMap).length > 0) {
      const animationName = rule.params
      if (!classMap.animations) {
        classMap.animations = {}
      }
      classMap.animations[animationName] = ruleClassMap
    }
  })
  root.walkRules(rule => {
    if (rule.parent.type === 'atrule') return
    walkRule({
      rule,
      classMap
    })
  })
  return classMap
}

module.exports = {
  getClassMap
}
