const babylon = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const isValidIdentifierStr = require('../utils/is-valid-identifier-str')
const escapeClassObjectKey = require('../utils/escape-class-object-key')

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
            const propertyName = typeof rawPropertyName === 'string' ? escapeClassObjectKey(rawPropertyName) : ''
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
