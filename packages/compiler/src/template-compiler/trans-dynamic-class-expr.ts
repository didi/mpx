import * as babylon from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import generate from '@babel/generator'

export default function transDynamicClassExpr (expr: string, { error } = {}) {
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
