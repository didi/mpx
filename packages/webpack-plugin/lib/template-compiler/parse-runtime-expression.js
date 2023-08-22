const babylon = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default

/**
 * some edge case:
 *
 * 1. 根节点只允许 expressionStatement，类型错误的兜底；
 *
 */

module.exports = function getRuntimeExps (str) {
  let exps = []

  const getValueVisitor = {
    ExpressionStatement (path) {
      const expression = path.node.expression

      const findExp = (node) => {
        // edge case
        if (!node) {
          return [{}]
        }
        if (t.isMemberExpression(node)) {
          const objectExps = findExp(node.object)
          let propertyExps = findExp(node.property)
          if (node.computed && propertyExps.length > 1) {
            propertyExps = [propertyExps]
          }
          return [...objectExps, ...propertyExps]
        } else if (t.isArrayExpression(node)) {
          const elements = node.elements
          const exps = []
          elements.forEach(node => {
            exps.push(findExp(node))
          })
          return exps
        } else {
          if (t.isIdentifier(node)) {
            return [{
              type: node.type,
              name: node.name
            }]
          } else if (t.isNumericLiteral(node) || t.isStringLiteral(node) || t.isBooleanLiteral(node) || t.isNullLiteral(node)) {
            return [{
              type: node.type,
              value: node.value
            }]
          } else {
            return [{}]
          }
        }
      }

      if (t.isExpression(expression)) {
        exps = findExp(expression)
      }
    },
    // 处理独立的字符串类型，babel-parser 处理的特殊场景: Directive 类型？后续需验证：'"testCode"'
    Directive (path) {
      exps = [
        {
          name: 'StringLiteral',
          value: path.node.value.value
        }
      ]
    }
  }

  const ast = babylon.parse(str)
  traverse(ast, getValueVisitor)

  return {
    exps
  }
}
