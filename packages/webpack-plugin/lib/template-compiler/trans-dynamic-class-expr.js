const babylon = require('@babel/parser')
const t = require('@babel/types')
const generate = require('@babel/generator').default

module.exports = function transDynamicClassExpr (expr, { error } = {}) {
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
            if (/\$/.test(propertyName)) {
              error && error(`Dynamic classname [${propertyName}] is not supported, which includes [-] char and [$] char at the same time.`)
            } else {
              property.key = t.identifier(propertyName.replace(/-/g, '$$') + 'MpxDash')
            }
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
