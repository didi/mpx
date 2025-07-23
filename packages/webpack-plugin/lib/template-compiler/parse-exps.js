// todo 待讨论 parser + interpreter 的部分是否需要单独抽个 package 出去
const acorn = require('acorn')
const walk = require('acorn-walk')

/**
 * 基于目前小程序所支持的模版语法实现，对于不支持的语法在编译阶段直接报错
 */

const NODE_TYPE = {
  Program: 1,
  Identifier: 2,
  Literal: 3,
  ArrayExpression: 28,
  ObjectExpression: 29,
  Property: 31,
  UnaryExpression: 33,
  // UpdateExpression: 34,
  BinaryExpression: 35,
  LogicalExpression: 37,
  MemberExpression: 38,
  ConditionalExpression: 39,
  ExpressionStatement: 40
}

const error = function (msg) {
  throw new Error(`[Mpx template error]: [Mpx dynamic expression parser error]: ${msg}`)
}

walk.full = function full (node, baseVisitor, state, override) {
  const stack = []
    ; (function c (node, st, override, s) {
    const type = override || node.type
    if (!baseVisitor[type]) {
      error(`${type} grammar is not supported in the template`)
    }
    baseVisitor[type](node, st, c, s)
  })(node, state, override, stack)

  // 限定 bodyStack 长度，仅支持单表达式的写法
  const bodyStackIndex = 1
  if (stack[bodyStackIndex].length > 1) {
    error('only support one expression in the template')
  }
  return stack
}

const baseVisitor = {}

baseVisitor.UnaryExpression = function (node, st, c, s) {
  // const nodeType = node.type === 'UnaryExpression' ? NODE_TYPE.UnaryExpression : NODE_TYPE.UpdateExpression
  const nodeType = NODE_TYPE.UnaryExpression
  const argumentNodeStack = []
  s.push(nodeType, node.operator, argumentNodeStack, node.prefix)
  c(node.argument, st, 'Expression', argumentNodeStack)
}

baseVisitor.BinaryExpression = baseVisitor.LogicalExpression = function (node, st, c, s) {
  const nodeType = node.type === 'BinaryExpression' ? NODE_TYPE.BinaryExpression : NODE_TYPE.LogicalExpression
  const leftNodeStack = []
  const rightNodeStack = []
  // todo operator 可以严格按照小程序模版能力进行限制
  s.push(nodeType, node.operator, leftNodeStack, rightNodeStack)
  c(node.left, st, 'Expression', leftNodeStack)
  c(node.right, st, 'Expression', rightNodeStack)
}

baseVisitor.ConditionalExpression = (node, st, c, s) => {
  const testNodeStack = []
  const consequentNodeStack = []
  const alternateNodeStack = []
  s.push(NODE_TYPE.ConditionalExpression, testNodeStack, consequentNodeStack, alternateNodeStack)
  c(node.test, st, 'Expression', testNodeStack)
  c(node.consequent, st, 'Expression', consequentNodeStack)
  c(node.alternate, st, 'Expression', alternateNodeStack)
}

const visitor = walk.make({
  Program (node, st, c, s) {
    const bodyStack = []
    s.push(NODE_TYPE.Program, bodyStack)
    for (let i = 0, list = node.body; i < list.length; i += 1) {
      const stmt = list[i]
      bodyStack[i] = []
      c(stmt, st, 'Statement', bodyStack[i])
    }
  },
  ExpressionStatement (node, st, c, s) {
    const expressionStack = []
    s.push(NODE_TYPE.ExpressionStatement, expressionStack)
    c(node.expression, st, null, expressionStack)
  },
  MemberExpression (node, st, c, s) {
    const objectNodeStack = []
    const propertyNodeStack = []
    s.push(NODE_TYPE.MemberExpression, objectNodeStack, propertyNodeStack, node.computed)
    c(node.object, st, 'Expression', objectNodeStack)
    c(node.property, st, 'Expression', propertyNodeStack)
  },
  ArrayExpression (node, st, c, s) {
    const elementsStack = []
    s.push(NODE_TYPE.ArrayExpression, elementsStack)
    node.elements.forEach((elt, index) => {
      if (elt) {
        elementsStack[index] = []
        c(elt, st, 'Expression', elementsStack[index])
      }
    })
  },
  ObjectExpression (node, st, c, s) {
    const propertiesStack = []
    s.push(NODE_TYPE.ObjectExpression, propertiesStack)
    node.properties.forEach((prop, index) => {
      propertiesStack[index] = []
      c(prop, st, null, propertiesStack[index])
    })
  },
  Property (node, st, c, s) {
    const keyNodeStack = []
    const valueNodeStack = []
    s.push(NODE_TYPE.Property, keyNodeStack, valueNodeStack, node.kind)
    c(node.key, st, 'Expression', keyNodeStack)
    c(node.value, st, 'Expression', valueNodeStack)
  },
  Literal (node, st, c, s) {
    // todo node.raw/-1 目前应该都用不到，后续可以优化
    s.push(NODE_TYPE.Literal, node.value, node.raw, -1) // -1?
  },
  Identifier (node, st, c, s) {
    s.push(NODE_TYPE.Identifier, node.name)
  },
  Expression (node, st, c, s) {
    c(node, st, null, s)
  },
  Statement (node, st, c, s) {
    c(node, st, null, s)
  }
}, baseVisitor)

module.exports = {
  parseExp (str) {
    // 确保 str 都是为 expressionStatement
    if (!/^\(*\)$/.test(str)) {
      str = `(${str})`
    }
    return walk.full(acorn.parse(str, { ecmaVersion: 5 }), visitor)
  },
  NODE_TYPE
}
