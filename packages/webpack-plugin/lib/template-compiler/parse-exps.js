// todo 待讨论 parser + interpreter 的部分是否需要单独抽个 package 出去
const acorn = require('acorn')
const walk = require('acorn-walk')

// todo 增加对于函数判断报错
walk.full = function full (node, baseVisitor, state, override) {
  const stack = []
    ; (function c (node, st, override, s) {
    const type = override || node.type
    baseVisitor[type](node, st, c, s)
  })(node, state, override, stack)
  return stack
}

const base = walk.base

base.UnaryExpression = base.UpdateExpression = function (node, st, c, s) {
  const nodeType = node.type === 'UnaryExpression' ? 33 : 34
  const argumentNodeStack = []
  s.push(nodeType, node.operator, argumentNodeStack, node.prefix)
  c(node.argument, st, 'Expression', argumentNodeStack)
}

base.BinaryExpression = base.LogicalExpression = function (node, st, c, s) {
  const nodeType = node.type === 'BinaryExpression' ? 35 : 37
  const leftNodeStack = []
  const rightNodeStack = []
  s.push(nodeType, node.operator, leftNodeStack, rightNodeStack)
  c(node.left, st, 'Expression', leftNodeStack)
  c(node.right, st, 'Expression', rightNodeStack)
}

base.ConditionalExpression = (node, st, c, s) => {
  const testNodeStack = []
  const consequentNodeStack = []
  const alternateNodeStack = []
  s.push(39, testNodeStack, consequentNodeStack, alternateNodeStack)
  c(node.test, st, 'Expression', testNodeStack)
  c(node.consequent, st, 'Expression', consequentNodeStack)
  c(node.alternate, st, 'Expression', alternateNodeStack)
}

const visitor = walk.make({
  Program (node, st, c, s) {
    const bodyStack = []
    // todo 后续优化可以去掉
    s.push(1, bodyStack, node.sourceType)
    for (let i = 0, list = node.body; i < list.length; i += 1) {
      const stmt = list[i]
      bodyStack[i] = []
      c(stmt, st, 'Statement', bodyStack[i])
    }
  },
  ExpressionStatement (node, st, c, s) {
    const expressionStack = []
    // todo 后续优化可以去掉
    s.push(40, expressionStack)
    c(node.expression, st, null, expressionStack)
  },
  MemberExpression (node, st, c, s) {
    const objectNodeStack = []
    const propertyNodeStack = []
    s.push(38, objectNodeStack, propertyNodeStack, node.computed)
    c(node.object, st, 'Expression', objectNodeStack)
    c(node.property, st, 'Expression', propertyNodeStack)
  },
  ArrayExpression (node, st, c, s) {
    const elementsStack = []
    s.push(28, elementsStack)
    node.elements.forEach((elt, index) => {
      if (elt) {
        elementsStack[index] = []
        c(elt, st, 'Expression', elementsStack[index])
      }
    })
  },
  ObjectExpression (node, st, c, s) {
    const propertiesStack = []
    s.push(29, propertiesStack)
    node.properties.forEach((prop, index) => {
      propertiesStack[index] = []
      c(prop, st, null, propertiesStack[index])
    })
  },
  Property (node, st, c, s) {
    const keyNodeStack = []
    const valueNodeStack = []
    s.push(31, keyNodeStack, valueNodeStack, node.kind)
    c(node.key, st, 'Expression', keyNodeStack)
    c(node.value, st, 'Expression', valueNodeStack)
  },
  Literal (node, st, c, s) {
    s.push(3, node.value, node.raw, -1) // -1?
  },
  Identifier (node, st, c, s) {
    s.push(2, node.name)
  },
  Expression (node, st, c, s) {
    c(node, st, null, s)
  },
  Statement (node, st, c, s) {
    c(node, st, null, s)
  }
})

module.exports = function (str) {
  // 确保 str 都是为 expressionStatement
  if (!/^\(*\)$/.test(str)) {
    str = `(${str})`
  }
  return walk.full(acorn.parse(str, { ecmaVersion: 'es5' }), visitor)
}
