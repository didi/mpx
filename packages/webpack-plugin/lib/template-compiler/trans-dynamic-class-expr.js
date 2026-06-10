const babylon = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const isValidIdentifierStr = require('../utils/is-valid-identifier-str')
function escapeRegExp (str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
const classNameEscapeMap = {
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
const classNameEscapeReg = new RegExp('[' + Object.keys(classNameEscapeMap).map(escapeRegExp).join('') + ']', 'g')

// classNameEscapeMap 的反向映射，用于还原 escapeClassName 编码
const classNameDecodeMap = Object.keys(classNameEscapeMap).reduce((acc, key) => {
  acc[classNameEscapeMap[key]] = key
  return acc
}, {})
const classNameDecodeReg = new RegExp(Object.keys(classNameDecodeMap).map(escapeRegExp).join('|'), 'g')

function escapeClassName (str) {
  return str.replace(classNameEscapeReg, function (match) {
    if (classNameEscapeMap[match]) return classNameEscapeMap[match]
    // unknown escaped
    return '_u_'
  })
}

function unescapeClassName (str) {
  return str.replace(classNameDecodeReg, m => classNameDecodeMap[m] || m)
}

const KEY_ESCAPE_SUFFIX = 'MpxEscape'
const KEY_ESCAPE_DASH = '_da_'
const KEY_ESCAPE_SPACE = '_sp_'

const keyEscapeMap = {
  '-': KEY_ESCAPE_DASH,
  ' ': KEY_ESCAPE_SPACE,
  '*': '_st_'
}
const keyDecodeMap = Object.keys(keyEscapeMap).reduce((acc, key) => {
  acc[keyEscapeMap[key]] = key
  return acc
}, {})
const keyDecodeReg = new RegExp(Object.keys(keyDecodeMap).map(escapeRegExp).join('|'), 'g')

function escapeKey (str) {
  const result = str.replace(/-/g, KEY_ESCAPE_DASH).replace(/\s+/g, KEY_ESCAPE_SPACE).replace(/\*/g, '_st_')
  if (result !== str) return result + KEY_ESCAPE_SUFFIX
  return str
}

function unescapeKey (str) {
  if (str.endsWith(KEY_ESCAPE_SUFFIX)) {
    return unescapeClassName(
      str.slice(0, -KEY_ESCAPE_SUFFIX.length).replace(keyDecodeReg, m => keyDecodeMap[m])
    )
  }
  return str
}

module.exports = transDynamicClassExpr
module.exports.KEY_ESCAPE_SUFFIX = KEY_ESCAPE_SUFFIX
module.exports.KEY_ESCAPE_DASH = KEY_ESCAPE_DASH
module.exports.KEY_ESCAPE_SPACE = KEY_ESCAPE_SPACE
module.exports.unescapeKey = unescapeKey
module.exports.escapeKey = escapeKey
module.exports.escapeClassName = escapeClassName

function transDynamicClassExpr (expr, { error } = {}) {
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
            const propertyName = escapeKey(escapeClassName(rawPropertyName))
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
