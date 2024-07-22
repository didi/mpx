const babylon = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const isValidIdentifierStr = require('../utils/is-valid-identifier-str')
const escapeReg = /[()[\]{}#!.:,%'"+$]/g
const escapeMap = {
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

function mpEscape (str) {
  return str.replace(escapeReg, function (match) {
    if (escapeMap[match]) return escapeMap[match]
    // unknown escaped
    return '_u_'
  })
}

function keyEscape (str) {
  let result = str.replace(/-/g, '_da_').replace(/\s+/g, '_sp_')
  if (result !== str) result += 'MpxEscape'
  return result
}

module.exports = function transDynamicClassExpr (expr, { error } = {}) {
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
            const propertyName = keyEscape(mpEscape(rawPropertyName))
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
