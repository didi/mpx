class Node {
  constructor (type, condition = null) {
    this.type = type // 'If', 'ElseIf', 'Else' 或 'Text'
    this.condition = condition // If 或 Elif 的条件
    this.children = []
    this.value = ''
  }
}

// 提取 css string 为 token
function tokenize (cssString) {
  const regex = /\/\*\s*@mpx-(if|elif|else|end)(?:\s*\((.*?)\))?\s*\*\//g
  const tokens = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(cssString)) !== null) {
    // 如果 token 前有普通文本，生成文本 token
    if (match.index > lastIndex) {
      const text = cssString.substring(lastIndex, match.index)
      tokens.push({ type: 'text', content: text })
    }
    // match[1] 为关键字：if, elif, else, end
    // match[2] 为条件（如果存在）
    tokens.push({
      type: match[1], // 'if'、'elif'、'else' 或 'end'
      condition: match[2] ? match[2].trim() : null
    })
    lastIndex = regex.lastIndex
  }
  // 处理结尾剩余的文本
  if (lastIndex < cssString.length) {
    const text = cssString.substring(lastIndex)
    tokens.push({ type: 'text', content: text })
  }
  return tokens
}

// parse：将生成的 token 数组构造成嵌套的 AST
function parse (cssString) {
  const tokens = tokenize(cssString)
  const ast = []
  const nodeStack = []
  let currentChildren = ast
  function pushConditionalNode (nodeType, condition) {
    // 获取父节点的 children 数组
    const parentChildren = nodeStack.length > 0 ? nodeStack[nodeStack.length - 1] : ast
    const node = new Node(nodeType, condition)
    parentChildren.push(node)
    // 入栈
    nodeStack.push(parentChildren)
    currentChildren = node.children
  }
  tokens.forEach(token => {
    switch (token.type) {
      case 'text': {
        // 生成 Text 节点，保存代码文本
        const textNode = new Node('Text')
        textNode.value = token.content
        currentChildren.push(textNode)
        break
      }
      case 'if': {
        pushConditionalNode('If', token.condition)
        break
      }
      case 'elif': {
        // 处理 mpx-elif：回到 if 块的父级 children 数组
        if (nodeStack.length === 0) {
          throw new Error('elif without a preceding if')
        }
        currentChildren = nodeStack[nodeStack.length - 1]
        pushConditionalNode('Elif', token.condition)
        break
      }
      case 'else': {
        if (nodeStack.length === 0) {
          throw new Error('else without a preceding if')
        }
        currentChildren = nodeStack[nodeStack.length - 1]
        pushConditionalNode('Else', null)
        break
      }
      case 'end': {
        // 结束当前条件块，弹出上一级 children 指针
        if (nodeStack.length > 0) {
          currentChildren = nodeStack.pop()
        } else {
          throw new Error('end without matching if')
        }
        break
      }
      default:
        break
    }
  })
  return ast
}

function evaluateCondition (condition, defs) {
  try {
    const keys = Object.keys(defs)
    const values = keys.map(key => defs[key])
    /* eslint-disable no-new-func */
    const func = new Function(...keys, `return (${condition});`)
    return func(...values)
  } catch (e) {
    console.error(`Error evaluating condition: ${condition}`, e)
    return false
  }
}

function traverseAndEvaluate (ast, defs) {
  let output = ''

  function traverse (nodes) {
    for (const node of nodes) {
      if (node.type === 'Rule') {
        output += node.value
      } else if (node.type === 'If') {
        // 直接判断 If 节点
        if (evaluateCondition(node.condition, defs)) {
          traverse(node.children)
        }
      } else if (node.type === 'ElseIf') {
        if (evaluateCondition(node.condition, defs)) {
          traverse(node.children)
          return
        }
      } else if (node.type === 'Else') {
        traverse(node.children)
        return
      }
    }
  }
  traverse(ast)
  return output
}

module.exports = function (css) {
  this.cacheable()
  const mpx = this.getMpx()
  const defs = mpx.defs
  const ast = parse(css)
  return traverseAndEvaluate(ast, defs)
}
