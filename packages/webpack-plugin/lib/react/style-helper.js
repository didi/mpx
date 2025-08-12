const postcss = require('postcss')
const selectorParser = require('postcss-selector-parser')
const getRulesRunner = require('../platform/index')
const dash2hump = require('../utils/hump-dash').dash2hump
const parseValues = require('../utils/string').parseValues
const unitRegExp = /^\s*(-?\d+(?:\.\d+)?)(rpx|vw|vh|px)?\s*$/
const hairlineRegExp = /^\s*hairlineWidth\s*$/
const varRegExp = /^--/
const cssPrefixExp = /^-(webkit|moz|ms|o)-/

function getClassMap ({ content, filename, mode, srcMode, warn, error }) {
  const classMap = {}

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
        value = `global.__${matched[2]}(${+matched[1]})`
        needStringify = false
      }
    }
    if (hairlineRegExp.test(value)) {
      value = `global.__formatValue(${JSON.stringify(value)})`
      needStringify = false
    }
    return needStringify ? JSON.stringify(value) : value
  }

  function getMediaOptions (params) {
    return parseValues(params).reduce((option, item) => {
      if (['all', 'print'].includes(item)) {
        if (item === 'media') {
          option.type = item
        } else {
          error('not supported ', item)
          return option
        }
      }
      if (['not', 'only', 'or', ','].includes(item)) {
        if (item === 'and') {
          option.logical_operators = item
        } else {
          error('not supported ', item)
          return option
        }
      }
      const bracketsExp = /\((.+?)\)/
      if (bracketsExp.test(item)) {
        const range = parseValues((item.match(bracketsExp)?.[1] || ''), ':')
        if (range.length < 2) {
          return option
        } else {
          option[dash2hump(range[0])] = +formatValue(range[1])
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

  root.walkRules(rule => {
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
    const options = getMediaOptions(rule.parent.params || '')
    const isMedia = options.maxWidth || options.minWidth
    selectorParser(selectors => {
      selectors.each(selector => {
        if (selector.nodes.length === 1 && selector.nodes[0].type === 'class') {
          classMapKeys.push(selector.nodes[0].value)
        } else {
          error('Only single class selector is supported in react native mode temporarily.')
        }
      })
    }).processSync(rule.selector)

    if (classMapKeys.length) {
      classMapKeys.forEach((key) => {
        if (Object.keys(classMapValue).length) {
          const _default = classMap[key]?._default || {}
          const _media = classMap[key]?._media || []
          if (isMedia) {
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
  })
  return classMap
}

module.exports = {
  getClassMap
}
