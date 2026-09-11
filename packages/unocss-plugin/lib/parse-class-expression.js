import parser from '@babel/parser'
import traverseModule from '@babel/traverse'
import types from '@babel/types'

const traverse = traverseModule.default

/**
 * 解析 class 表达式中的普通字符串和非计算对象 key，并保留其源码偏移。
 *
 * @param {string} expr
 * @returns {{
 *   strings: Array<{result: string, start: number, end: number}>,
 *   objectKeys: Array<{result: unknown, start: number, end: number}>
 * }}
 */
export default function parseClassExpression (expr) {
  const result = {
    strings: [],
    objectKeys: []
  }
  if (!expr) return result
  try {
    const expression = parser.parseExpression(expr, {
      plugins: [
        'objectRestSpread'
      ]
    })
    const ast = types.file(types.program([types.expressionStatement(expression)]))
    traverse(ast, {
      ObjectProperty (path) {
        const property = path.node
        if (!property.computed) {
          result.objectKeys.push({
            result: types.isIdentifier(property.key) ? property.key.name : property.key.value,
            start: property.key.start,
            end: property.key.end - 1
          })
        }
      },
      StringLiteral (path) {
        const node = path.node
        const propertyPath = path.findParent(path => path.isObjectProperty())
        if (propertyPath) {
          const key = propertyPath.node.key
          if (node.start >= key.start && node.end <= key.end) return
        }
        result.strings.push({
          result: node.value,
          start: node.start + 1,
          end: node.end - 2
        })
      }
    })
  } catch (e) {
  }
  return result
}
