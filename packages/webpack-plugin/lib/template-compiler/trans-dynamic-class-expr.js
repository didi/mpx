const babylon = require('@babel/parser')
const t = require('@babel/types')
const generate = require('@babel/generator').default
const dash2hump = require('../utils/hump-dash').dash2hump

module.exports = function transDynamicClassExpr (expr) {
  try {
    const ast = babylon.parseExpression(expr, {
      plugins: [
        'objectRestSpread'
      ]
    })
    if (t.isObjectExpression(ast)) {
      ast.properties.forEach((property) => {
        if (t.isObjectProperty(property) && !property.computed) {
          const propertyName = property.key.name || property.key.value
          if (/-/.test(propertyName)) {
            property.key = t.identifier(dash2hump(propertyName) + 'MpxDash')
          } else {
            property.key = t.identifier(propertyName)
          }
        }
      })
    }
    return generate(ast, {
      compact: true
    }).code
  } catch (e) {
    return expr
  }
}
