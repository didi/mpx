const babylon = require('babylon')
const t = require('babel-types')
const generate = require('babel-generator').default
const dash2hump = require('../utils/hump-dash').dash2hump

export default function transDynamicClassExpr (expr) {
  expr = babylon.parseExpression(expr)
  if (t.isObjectExpression(expr)) {
    expr.properties.forEach((property) => {
      if (t.isObjectProperty(property) && !property.computed) {
        const propertyName = property.key.name || property.key.value
        if (/-/.test(propertyName)) {
          property.key = t.identifier(dash2hump(propertyName) + 'MpxDash')
        }
      }
    })
  }
  return generate(expr, {
    compact: true
  }).code
}
