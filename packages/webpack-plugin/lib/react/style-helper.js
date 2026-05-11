const postcss = require('postcss')
const selectorParser = require('postcss-selector-parser')
const { MPX_TAG_PAGE_SELECTOR } = require('../utils/const')
const getRulesRunner = require('../platform/index')
const createDiagnostic = require('../platform/create-diagnostic')
const dash2hump = require('../utils/hump-dash').dash2hump
const parseValues = require('../utils/string').parseValues
const unitRegExp = /^\s*(-?\d+(?:\.\d+)?)(rpx|vw|vh|px)?\s*$/
const hairlineRegExp = /^\s*hairlineWidth\s*$/
const varRegExp = /^--/
const cssPrefixExp = /^-(webkit|moz|ms|o)-/
function getClassMap ({ content, styles, filename, inputFileSystem, mode, srcMode, ctorType, formatValueName, warn, error }) {
  const classMap = ctorType === 'page'
      ? { [MPX_TAG_PAGE_SELECTOR]: { flex: 1, height: "'100%'" } }
      : {}

  styles = styles && styles.length
    ? styles
    : [{
        content,
        filename
      }]

  function formatValue (value) {
    let needStringify = true
    const matched = unitRegExp.exec(value)
    if (matched) {
      if (!matched[2] || matched[2] === 'px') {
        value = matched[1]
        needStringify = false
      } else {
        value = `${formatValueName}(${+matched[1]}, '${matched[2]}')`
        needStringify = false
      }
    }
    if (hairlineRegExp.test(value)) {
      value = `${formatValueName}(${JSON.stringify(value)}, 'hairlineWidth')`
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

  styles.forEach((style) => {
    const styleContent = style.content || ''
    if (!styleContent.trim()) return
    const styleFilename = style.filename || filename
    const sourceMap = style.map
    const diagnostic = {
      file: styleFilename,
      source: styleContent,
      sourceMap,
      inputFileSystem
    }
    const reporter = createDiagnostic({
      type: 'style',
      mode,
      srcMode,
      warn,
      error,
      diagnostic
    })
    const root = postcss.parse(styleContent, {
      from: styleFilename
    })
    const rulesRunner = getRulesRunner({
      mode,
      srcMode,
      type: 'style',
      testKey: 'prop',
      warn,
      error,
      diagnostic
    })

    // 目前所有 AtRule 只支持 @media，其他全部给出错误提示
    root.walkAtRules(rule => {
      if (rule.name !== 'media') {
        reporter.warn(`Only @media rule is supported in react native mode temporarily, but got @${rule.name}`, {
          node: rule,
          sourceMap,
          target: {
            kind: 'css-atrule',
            name: rule.name,
            params: rule.params
          }
        })
        // 删除不支持的 AtRule，防止其影响后续解析
        rule.remove()
      }
    })

    root.walkRules(rule => {
      const classMapValue = {}
      rule.walkDecls((decl) => {
        let { prop, value } = decl
        if (value === 'undefined' || cssPrefixExp.test(prop) || cssPrefixExp.test(value)) return
        let newData = rulesRunner && rulesRunner({ prop, value, selector: rule.selector, decl, rule, sourceMap })
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
            reporter.error('Only single class selector is supported in react native mode temporarily.', {
              node: rule,
              sourceMap,
              target: {
                kind: 'selector',
                value: rule.selector
              }
            })
          }
        })
      }).processSync(rule.selector)

      if (classMapKeys.length) {
        classMapKeys.forEach((key) => {
          if (Object.keys(classMapValue).length) {
            // set css defalut value
            const val = classMap[key] || {}
            classMap[key] = Object.assign(val, classMapValue)

            // set css media
            if (isMedia) {
              const _media = classMap[key]?._media || []
              _media.push({
                options,
                value: classMapValue
              })
              classMap[key]._media = _media
            }
          }
        })
      }
    })
  })
  return classMap
}

module.exports = {
  getClassMap
}
