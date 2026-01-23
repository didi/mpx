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
  // Support /* ... */, // ..., and <!-- ... --> styles
  // 1. : /\/\*\s*@mpx-(if|elif|else|endif)(?:\s*\(([\s\S]*?)\))?\s*\*\//g
  // 2. : /\/\/\s*@mpx-(if|elif|else|endif)(?:\s*\((.*?)\))?\s*$/gm
  // 3. : /<!--\s*@mpx-(if|elif|else|endif)(?:\s*\(([\s\S]*?)\))?\s*-->/g
  // Combined:
  const regex = /(?:\/\*\s*@mpx-(if|elif|else|endif)(?:\s*\(([\s\S]*?)\))?\s*\*\/)|(?:\/\/\s*@mpx-(if|elif|else|endif)(?:\s*\((.*?)\))?\s*)|(?:<!--\s*@mpx-(if|elif|else|endif)(?:\s*\(([\s\S]*?)\))?\s*-->)/g
  const tokens = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(cssString)) !== null) {
    // 如果 token 前有普通文本，生成文本 token
    if (match.index > lastIndex) {
      const text = cssString.substring(lastIndex, match.index)
      tokens.push({ type: 'text', content: text })
    }
    // 1,2: (/* ... */)
    // 3,4: (// ...)
    // 5,6: (<!-- ... -->)
    const type = match[1] || match[3] || match[5]
    const condition = (match[2] || match[4] || match[6])

    tokens.push({
      type: type,
      condition: condition ? condition.trim() : null
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
      currentChildren.push(node)
      nodeStack.push(currentChildren)
      currentChildren = node.children
    } else if (token.type === 'elif') {
      if (nodeStack.length === 0) {
        throw new Error('[Mpx style error]: elif without a preceding if')
      }
      currentChildren = nodeStack[nodeStack.length - 1]
      const node = new Node('ElseIf', token.condition)
      currentChildren.push(node)
      currentChildren = node.children
    } else if (token.type === 'else') {
      if (nodeStack.length === 0) {
        throw new Error('[Mpx style error]: else without a preceding if')
      }
      currentChildren = nodeStack[nodeStack.length - 1]
      const node = new Node('Else')
      currentChildren.push(node)
      currentChildren = node.children
    } else if (token.type === 'endif') {
      if (nodeStack.length > 0) {
        currentChildren = nodeStack.pop()
      }
    }
  })
  if (nodeStack.length > 0) {
    throw new Error('[Mpx strip conditional error]: mpx-if without a matching endif')
  }
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
        if (evaluateCondition(node.condition, defs)) {
          traverse(node.children)
          batchedIf = true
        }
      } else if (node.type === 'ElseIf' && !batchedIf) {
        if (evaluateCondition(node.condition, defs)) {
          traverse(node.children)
          batchedIf = true
        }
      } else if (node.type === 'Else' && !batchedIf) {
        traverse(node.children)
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
  return traverseAndEvaluate(ast, defs)
}

let proxyReadFileSync
let proxyReadFile
const rawReadFileSync = fs.readFileSync
const rawReadFile = fs.readFile

let isRewritten = false
let __compilation = null

function registerStripCompilation(compilation) {
  __compilation = compilation
}

function logStripError(path, e) {
  const msg = `[Mpx strip conditional error]\n  path: ${path}\n  message: ${e && e.message}\n  stack:\n${e && e.stack}`
  console.error(msg)
  if (__compilation && Array.isArray(__compilation.errors)) {
    const err = new Error(msg)
    err.file = path
    __compilation.errors.push(err)
  }
}

function rewriteFSForCss() {
  if (isRewritten) return
  isRewritten = true
  fs.readFileSync = function () {
    return (proxyReadFileSync || rawReadFileSync).apply(fs, arguments)
  }
  fs.readFile = function () {
    return (proxyReadFile || rawReadFile).apply(fs, arguments)
  }
}

function startFSStripForCss(defs) {
  function shouldStrip(path) {
    return typeof path === 'string' && /\.(styl|scss|sass|less|css|mpx)$/.test(path)
  }
  proxyReadFileSync = function (path, options) {
    const content = rawReadFileSync.call(fs, path, options)
    if (shouldStrip(path)) {
      try {
        if (typeof content === 'string') {
          return stripCondition(content, defs)
        } else if (Buffer.isBuffer(content)) {
          const str = content.toString('utf-8')
          const result = stripCondition(str, defs)
          if (result !== str) {
            return Buffer.from(result, 'utf-8')
          }
        }
      } catch (e) {
        logStripError(path, e)
        return content
      }
    }
    return content
  }

  proxyReadFile = function () {
    const args = Array.from(arguments)
    const callback = args[args.length - 1]
    const path = args[0]

    if (typeof callback !== 'function') {
      return rawReadFile.apply(fs, args)
    }

    const wrappedCallback = (err, data) => {
      if (err) return callback(err)
      if (shouldStrip(path)) {
        try {
          if (typeof data === 'string') {
            const result = stripCondition(data, defs)
            return callback(null, result)
          } else if (Buffer.isBuffer(data)) {
            const content = data.toString('utf-8')
            const result = stripCondition(content, defs)
            if (result !== content) {
              return callback(null, Buffer.from(result, 'utf-8'))
            }
          }
        } catch (e) {
          logStripError(path, e)
          return callback(null, data)
        }
      }
      callback(null, data)
    }

    args[args.length - 1] = wrappedCallback
    return rawReadFile.apply(fs, args)
  }
}

module.exports.stripCondition = stripCondition
module.exports.rewriteFSForCss = rewriteFSForCss
module.exports.startFSStripForCss = startFSStripForCss
module.exports.registerStripCompilation = registerStripCompilation
