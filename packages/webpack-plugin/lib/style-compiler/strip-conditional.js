const fs = require('fs')
const { STYLE_PAD_PLACEHOLDER } = require('../utils/const')

class Node {
  constructor(type, condition = null, value = '') {
    this.type = type // 'If', 'ElseIf', 'Else' 或 'Text'
    this.condition = condition // If 或 Elif 的条件
    this.children = []
    this.value = value
  }
}

function keepLines(content) {
  return content.replace(/([^\r\n]*)(\r\n|\r|\n|$)/g, (all, line, lineBreak) => {
    if (!all) return ''
    // 空行 / 纯空白行直接保留换行：directive 自身被 blankDirective 抹平后，
    // 其前后 text token 里夹缝 \n 形成的"空行"如果再放占位注释，会变成 col 0 的
    // /* mpx-style-pad-placeholder */，破坏 stylus / sass 的 indent 结构。
    // 这里产生的连续空行最多只有 directive 链长度量级（个位数），远低于 stylus
    // lexer 栈溢出阈值，安全。
    if (!line.trim()) return lineBreak
    const indent = (/^[ \t]*/.exec(line) || [''])[0]
    return `${indent}/* ${STYLE_PAD_PLACEHOLDER} */${lineBreak}`
  })
}

// 仅保留换行、清掉所有非换行字符，让条件编译指令本身的列位置在
// 缩进敏感的预处理器（stylus / sass）中完全透明。
// 不能直接把整段都换成空行 —— stylus 的 lexer 在遇到大量连续空行时
// 会递归判定 outdent 层级，触发调用栈溢出；因此被剥离的"内容"仍走
// keepLines 走占位注释，只让"指令"这一行（通常 1 行）变成空行。
function blankDirective(content) {
  return content.replace(/[^\r\n]+/g, '')
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
      condition: condition ? condition.trim() : null,
      content: match[0]
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
      const node = new Node('Text', null, token.content)
      currentChildren.push(node)
    } else if (token.type === 'if') {
      const node = new Node('If', token.condition, token.content)
      currentChildren.push(node)
      nodeStack.push(currentChildren)
      currentChildren = node.children
    } else if (token.type === 'elif') {
      if (nodeStack.length === 0) {
        throw new Error('[Mpx style error]: elif without a preceding if')
      }
      currentChildren = nodeStack[nodeStack.length - 1]
      const node = new Node('ElseIf', token.condition, token.content)
      currentChildren.push(node)
      currentChildren = node.children
    } else if (token.type === 'else') {
      if (nodeStack.length === 0) {
        throw new Error('[Mpx style error]: else without a preceding if')
      }
      currentChildren = nodeStack[nodeStack.length - 1]
      const node = new Node('Else', null, token.content)
      currentChildren.push(node)
      currentChildren = node.children
    } else if (token.type === 'endif') {
      if (nodeStack.length > 0) {
        currentChildren.push(new Node('EndIf', null, token.content))
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
  function traverse(nodes, active) {
    let output = ''
    let batchedIf = false
    for (const node of nodes) {
      if (node.type === 'Text') {
        output += active ? node.value : keepLines(node.value)
      } else if (node.type === 'If') {
        // 直接判断 If 节点
        output += blankDirective(node.value)
        const currentMatched = active && evaluateCondition(node.condition, defs)
        output += traverse(node.children, currentMatched)
        batchedIf = currentMatched
      } else if (node.type === 'ElseIf') {
        output += blankDirective(node.value)
        const currentMatched = active && !batchedIf && evaluateCondition(node.condition, defs)
        output += traverse(node.children, currentMatched)
        batchedIf = batchedIf || currentMatched
      } else if (node.type === 'Else') {
        output += blankDirective(node.value)
        const currentMatched = active && !batchedIf
        output += traverse(node.children, currentMatched)
        batchedIf = true
      } else if (node.type === 'EndIf') {
        output += blankDirective(node.value)
      }
    }
    return output
  }
  return traverse(ast, true)
}

/**
 *处理普通字符串的内部方法
 * @param {string} content
 * @param {Record<string, any>} defs
 * @returns
 */
function doStripCondition(content, defs) {
  const ast = parse(content)
  return traverseAndEvaluate(ast, defs)
}

/**
 * 检测内容中是否包含条件编译指令
 * @param {string} content
 * @returns {boolean}
 */
function hasConditionalDirective(content) {
  const regex = /(?:\/\*\s*@mpx-(if|elif|else|endif)(?:\s*\([\s\S]*?\))?\s*\*\/)|(?:\/\/\s*@mpx-(if|elif|else|endif)(?:\s*\(.*?\))?\s*)|(?:<!--\s*@mpx-(if|elif|else|endif)(?:\s*\([\s\S]*?\))?\s*-->)/
  return regex.test(content)
}

/**
 * 处理 .mpx 文件内容：
 * 1. 仅对 <style> 块中的内容进行条件编译裁剪
 * 2. 非 <style> 区域出现条件指令时通过 logStripError 报错并返回原始内容
 * @param {string} content .mpx 文件完整内容
 * @param {Record<string, any>} defs 条件变量定义
 * @param {string=} path 文件路径
 * @returns {string} 处理后的内容
 */
function stripConditionMpx(content, defs, path) {
  // 匹配 <style ...> ... </style> 块（支持多个 style 块）
  const styleRegex = /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi
  let lastIndex = 0
  let result = ''
  let match

  while ((match = styleRegex.exec(content)) !== null) {
    // match.index 到 match[1] 结束前的内容为非 style 区域
    const beforeStyle = content.substring(lastIndex, match.index)
    // 检测非 style 区域是否包含条件指令
    if (hasConditionalDirective(beforeStyle)) {
      logStripError(path, new Error('@mpx conditional directives are only allowed inside <style> blocks in .mpx files'))
      return content
    }
    result += beforeStyle
    // 处理 style 块内容
    const styleOpen = match[1]
    const styleContent = match[2]
    const styleClose = match[3]
    const strippedStyle = doStripCondition(styleContent, defs)
    result += styleOpen + strippedStyle + styleClose
    lastIndex = styleRegex.lastIndex
  }

  // 处理最后一个 style 块之后的剩余内容
  const remaining = content.substring(lastIndex)
  if (hasConditionalDirective(remaining)) {
    logStripError(path, new Error('@mpx conditional directives are only allowed inside <style> blocks in .mpx files'))
    return content
  }
  result += remaining
  return result
}

function isMpxFile(path) {
  return typeof path === 'string' && /\.mpx$/.test(path)
}

/**
 * 统一条件编译裁剪入口：
 * - 传入 .mpx 文件路径时，仅裁剪 <style> 块中的条件编译
 * - 未传入 path 或传入普通样式文件路径时，按普通样式字符串裁剪
 * @param {string} content
 * @param {Record<string, any>} defs
 * @param {string=} path
 * @returns {string}
 */
function stripCondition(content, defs, path) {
  if (isMpxFile(path)) {
    return stripConditionMpx(content, defs, path)
  }
  return doStripCondition(content, defs)
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
          return stripCondition(content, defs, path)
        } else if (Buffer.isBuffer(content)) {
          const str = content.toString('utf-8')
          const result = stripCondition(str, defs, path)
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
            const result = stripCondition(data, defs, path)
            return callback(null, result)
          } else if (Buffer.isBuffer(data)) {
            const content = data.toString('utf-8')
            const result = stripCondition(content, defs, path)
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
