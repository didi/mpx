const fs = require('fs')

class Node {
  constructor(type, condition = null) {
    this.type = type // 'If', 'ElseIf', 'Else' 或 'Text'
    this.condition = condition // If 或 Elif 的条件
    this.children = []
    this.value = ''
  }
}

// 提取 css string 为 token
function tokenize(cssString) {
  const regex = /\/\*\s*@mpx-(if|elif|else|endif)(?:\s*\((.*?)\))?\s*\*\//g
  const tokens = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(cssString)) !== null) {
    // 如果 token 前有普通文本，生成文本 token
    if (match.index > lastIndex) {
      const text = cssString.substring(lastIndex, match.index)
      tokens.push({ type: 'text', content: text })
    }
    // match[1] 为关键字：if, elif, else, endif
    // match[2] 为条件（如果存在）
    tokens.push({
      type: match[1], // 'if'、'elif'、'else' 或 'endif'
      condition: match[2] ? match[2].trim() : null,
      rawValue: match[0]
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
function parse(cssString) {
  const tokens = tokenize(cssString)
  const ast = []
  const nodeStack = []
  let currentChildren = ast
  tokens.forEach(token => {
    if (token.type === 'text') {
      const node = new Node('Text')
      node.value = token.content
      currentChildren.push(node)
    } else if (token.type === 'if') {
      const node = new Node('If', token.condition)
      node.rawValue = token.rawValue || ''
      currentChildren.push(node)
      nodeStack.push(currentChildren)
      currentChildren = node.children
    } else if (token.type === 'elif') {
      if (nodeStack.length === 0) {
        throw new Error('[Mpx style error]: elif without a preceding if')
      }
      currentChildren = nodeStack[nodeStack.length - 1]
      const node = new Node('ElseIf', token.condition)
      node.rawValue = token.rawValue || ''
      currentChildren.push(node)
      currentChildren = node.children
    } else if (token.type === 'else') {
      if (nodeStack.length === 0) {
        throw new Error('[Mpx style error]: else without a preceding if')
      }
      currentChildren = nodeStack[nodeStack.length - 1]
      const node = new Node('Else')
      node.rawValue = token.rawValue || ''
      currentChildren.push(node)
      currentChildren = node.children
    } else if (token.type === 'endif') {
      const node = new Node('EndIf')
      node.rawValue = token.rawValue || ''
      if (nodeStack.length > 0) {
        currentChildren = nodeStack.pop()
      }
      currentChildren.push(node)
    }
  })
  return ast
}

function evaluateCondition(condition, defs) {
  try {
    const keys = Object.keys(defs)
    const values = keys.map(key => defs[key])
    /* eslint-disable no-new-func */
    const func = new Function(...keys, `return (${condition});`)
    return func(...values)
  } catch (e) {
    console.error(`[Mpx style error]:Error evaluating condition: ${condition}`, e)
    return false
  }
}

function traverseAndEvaluate(ast, defs) {
  let output = ''
  let batchedIf = false
  function traverse(nodes) {
    for (const node of nodes) {
      if (node.type === 'Text') {
        output += node.value
      } else if (node.type === 'If') {
        // 直接判断 If 节点
        batchedIf = false
        output += node.rawValue || ''
        if (evaluateCondition(node.condition, defs)) {
          traverse(node.children)
          batchedIf = true
        }
      } else if (node.type === 'ElseIf' && !batchedIf) {
        output += node.rawValue || ''
        if (evaluateCondition(node.condition, defs)) {
          traverse(node.children)
          batchedIf = true
        }
      } else if (node.type === 'Else' && !batchedIf) {
        output += node.rawValue || ''
        traverse(node.children)
      } else if (node.type === 'EndIf') {
        output += node.rawValue || ''
      }
    }
  }
  traverse(ast)
  return output
}

/**
 *
 * @param {string} content
 * @param {Record<string, any>} defs
 * @returns
 */
function stripCondition(content, defs) {
  const ast = parse(content)
  const result = traverseAndEvaluate(ast, defs)
  return result
}
/**
 * @param {StripByPostcssOption} options
 */
async function stripByPostcss(options) {
  const defs = options.defs ?? {}
  const afterConditionStrip = stripCondition(options.css, defs)
  return {
    css: afterConditionStrip
  }
}

function rewriteReadFileSyncForCss(defs) {
  function shouldStrip(path) {
    return typeof path === 'string' && /\.(styl|scss|sass|less|css)$/.test(path)
  }

  const readFileSync = fs.readFileSync
  const readFile = fs.readFile

  fs.readFileSync = function (path, options) {
    const content = readFileSync.call(fs, path, options)
    if (shouldStrip(path)) {
      try {
        if (typeof content === 'string') {
          return stripCondition(content, defs)
        }
      } catch (e) {
        return content
      }
    }
    return content
  }

  fs.readFile = function (path, options, callback) {
    // 处理参数重载
    let cb = callback
    if (typeof options === 'function') {
      cb = options
      options = null
    }

    const wrappedCallback = (err, data) => {
      if (err) return cb(err)
      if (shouldStrip(path)) {
        try {
          if (typeof data === 'string') {
            const result = stripCondition(data, defs)
            return cb(null, result)
          }
        } catch (e) {
          return cb(null, data)
        }
      }
      cb(null, data)
    }

    if (options) {
      return readFile.call(fs, path, options, wrappedCallback)
    }
    return readFile.call(fs, path, wrappedCallback)
  }
}
/**
 *
 * @this {import('webpack').LoaderContext<any>}
 * @param {string} css
 */
module.exports = async function (css) {
  this.cacheable()
  const callback = this.async()
  const mpx = this.getMpx()
  const result = stripCondition(css, mpx.defs)
  callback(null, result)
}

module.exports.stripByPostcss = stripByPostcss
module.exports.stripCondition = stripCondition
module.exports.rewriteReadFileSyncForCss = rewriteReadFileSyncForCss
