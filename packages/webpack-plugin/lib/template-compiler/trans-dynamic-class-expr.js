const babylon = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const isValidIdentifierStr = require('../utils/is-valid-identifier-str')
function escapeRegExp (str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
const mpEscapeMap = {
  '(': '_pl_',
  ')': '_pr_',
  '[': '_bl_',
  ']': '_br_',
  '{': '_cl_',
  '}': '_cr_',
  '#': '_h_',
  '!': '_i_',
  '/': '_s_',
  '.': '_d_',
  ':': '_c_',
  ',': '_2c_',
  '%': '_p_',
  "'": '_q_',
  '"': '_dq_',
  '+': '_a_',
  $: '_si_'
}
const mpEscapeReg = new RegExp('[' + Object.keys(mpEscapeMap).map(escapeRegExp).join('') + ']', 'g')

// mpEscapeMap 的反向映射，用于还原 mpEscape 编码
const mpDecodeMap = Object.keys(mpEscapeMap).reduce((acc, key) => {
  acc[mpEscapeMap[key]] = key
  return acc
}, {})
const mpDecodeReg = new RegExp(Object.keys(mpDecodeMap).map(escapeRegExp).join('|'), 'g')

function getMpEscapeReg (escapeMap) {
  if (!escapeMap || escapeMap === mpEscapeMap) {
    return mpEscapeReg
  }
  const keys = Object.keys(escapeMap).filter(key => key !== 'unknown')
  if (!keys.length) return null
  return new RegExp(keys.sort((a, b) => b.length - a.length).map(escapeRegExp).join('|'), 'g')
}

function getMpDecodeInfo (escapeMap) {
  if (!escapeMap || escapeMap === mpEscapeMap) {
    return {
      map: mpDecodeMap,
      reg: mpDecodeReg
    }
  }
  const decodeMap = Object.keys(escapeMap).reduce((acc, key) => {
    if (key !== 'unknown') acc[escapeMap[key]] = key
    return acc
  }, {})
  const keys = Object.keys(decodeMap)
  if (!keys.length) {
    return {
      map: decodeMap,
      reg: null
    }
  }
  return {
    map: decodeMap,
    reg: new RegExp(keys.sort((a, b) => b.length - a.length).map(escapeRegExp).join('|'), 'g')
  }
}

function mpEscape (str, escapeMap = mpEscapeMap) {
  const escapeReg = getMpEscapeReg(escapeMap)
  if (!escapeReg) return str
  return str.replace(escapeReg, function (match) {
    if (escapeMap[match]) return escapeMap[match]
    // unknown escaped
    return escapeMap.unknown || '_u_'
  })
}

function mpUnescape (str, escapeMap) {
  const { map, reg } = getMpDecodeInfo(escapeMap)
  if (!reg) return str
  return str.replace(reg, m => map[m] || m)
}

const KEY_ESCAPE_SUFFIX = 'MpxEscape'

const keyEscapeMap = {
  '-': '_da_',
  ' ': '_sp_',
  '*': '_st_'
}
const keyDecodeMap = Object.keys(keyEscapeMap).reduce((acc, key) => {
  acc[keyEscapeMap[key]] = key
  return acc
}, {})
const keyDecodeReg = new RegExp(Object.keys(keyDecodeMap).map(escapeRegExp).join('|'), 'g')

function escapeKey (str) {
  const result = str.replace(/-/g, '_da_').replace(/\s+/g, '_sp_').replace(/\*/g, '_st_')
  if (result !== str) return result + KEY_ESCAPE_SUFFIX
  return str
}

function unescapeKey (str) {
  if (str.endsWith(KEY_ESCAPE_SUFFIX)) {
    return str.slice(0, -KEY_ESCAPE_SUFFIX.length).replace(keyDecodeReg, m => keyDecodeMap[m])
  }
  return str
}

module.exports = transDynamicClassExpr
module.exports.unescapeKey = unescapeKey
module.exports.escapeKey = escapeKey
module.exports.mpUnescape = mpUnescape
module.exports.mpEscape = mpEscape
module.exports.mpEscapeMap = mpEscapeMap

function transDynamicClassExpr (expr, { error, escapeMap } = {}) {
  try {
    const ast = babylon.parse(expr, {
      plugins: [
        'objectRestSpread'
      ]
    })
    traverse(ast, {
      ObjectExpression (path) {
        path.node.properties.forEach((property) => {
          if (t.isObjectProperty(property) && !property.computed) {
            const rawPropertyName = property.key.name || property.key.value
            const propertyName = escapeKey(mpEscape(rawPropertyName, escapeMap))
            if (!isValidIdentifierStr(propertyName)) {
              error && error(`Dynamic classname [${rawPropertyName}] can not be escaped as a valid identifier, which is not supported.`)
            } else {
              property.key = t.identifier(propertyName)
            }
          }
        })
      }
    })
    return generate(ast.program.body[0].expression, {
      compact: true
    }).code
  } catch (e) {
    return expr
  }
}
