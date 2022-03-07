const babylon = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default

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
            const propertyName = property.key.name || property.key.value
            if (/-/.test(propertyName)) {
              if (/\$/.test(propertyName)) {
                error && error(`Dynamic classname [${propertyName}] is not supported, which includes [-] char and [$] char at the same time.`)
              } else {
                property.key = t.identifier(propertyName.replace(/-/g, '$$') + 'MpxDash')
              }
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
