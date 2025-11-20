const fs = require('fs/promises')
const parseRequest = require('../utils/parse-request')
const path = require('path')
const loaderUtils = require('loader-utils')
const url = require('url')

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
  const result = traverseAndEvaluate(ast, defs)
  return result
}

// 参考 stylus/lib/functions/resolver.js 对 url 的处理逻辑
function shouldReserveUrl(filename) {
  // @ts-ignore
  // eslint-disable-next-line node/no-deprecated-api
  const parsed = url.parse(filename)
  return parsed.protocol
}

/**
 * @typedef {Object} StripByPostcssOption
 * @property {string} lang 样式语法格式
 * @property {string} resourcePath 文件路径
 * @property {string} css 源文件
 * @property {Record<string, any>} defs 条件定义
 * @property {import('webpack').LoaderContext<any>['resolve']} resolve webpack resolve 方法
 */

/**
 * @typedef {Object} AtImportConfig
 * @property {string} from 当前文件路径
 * @property {(filename: string) => Promise<string> | string;} load 加载文件内容的函数
 * @property {(id: string, base: string) => Promise<string | null> | string | null;} resolve 解析文件路径的函数
 */

async function atImport(options) {
  let { css, load, resolve, from } = options
  const fromParent = path.dirname(from)
  const e1 = /\/\*[\s\S]*?\*\//g
  // 匹配 // 单行注释，可能匹配到静态资源中的 http:// 的 //，不过影响不大， @import 不太可能出现在静态资源链接中
  const e2 = /\/\/.*/g
  // 使用正则匹配匹配出 多行注释和单行注释
  const comments = []
  let comment
  while ((comment = e1.exec(css))) {
    const [content] = comment
    comments.push({
      start: comment.index,
      end: comment.index + content.length,
      content: content
    })
  }

  while ((comment = e2.exec(css))) {
    const [content] = comment
    comments.push({
      start: comment.index,
      end: comment.index + content.length,
      content: content
    })
  }

  // 排序方便二分
  comments.sort((a, b) => (a.start > b.start ? 1 : -1))

  function isInComments(index) {
    let left = 0
    let right = comments.length - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const comment = comments[mid]

      if (index >= comment.start && index <= comment.end) {
        return true
      } else if (index < comment.start) {
        right = mid - 1
      } else {
        left = mid + 1
      }
    }

    return false
  }

  // 使用正则表达式匹配出所有 @import 语法，语法包含 @import "path", @import 'path', @import url("path"), @import url('path')
  // 注意清理分号，否则留个分号会报错
  const importRegex = /@import\s+(url\(['"]([^'"]+)['"]\)|['"]([^'"]+)['"])(\s*;)?/g
  let importList = []
  let importMatch
  while ((importMatch = importRegex.exec(css))) {
    const fullMatch = importMatch[0]
    const importSyntax = fullMatch.trim()
    importSyntax.startsWith('@import')
    const importValue = importSyntax.slice(7).trim()
    // 匹配 @import 后字符串格式
    const importUrlRegex = /url\s*\(['"]([^'"]+)['"]\)/g
    const importStrRegexp = /^(['"])([^'"]+)\1/

    let urlMatch = null
    if (importValue.startsWith('url')) {
      urlMatch = importUrlRegex.exec(importValue)?.[1]
    } else {
      urlMatch = importStrRegexp.exec(importValue)?.[2]
    }
    if (!urlMatch) {
      continue
    }

    importList.push({
      start: importMatch.index,
      end: importMatch.index + fullMatch.length,
      content: fullMatch,
      url: urlMatch
    })
  }

  // 过滤掉在注释中的 @import 语法
  importList = importList.filter(imp => !isInComments(imp.start))

  // 逆序替换 import，避免修改内容导致的索引偏移问题
  importList.sort((a, b) => (a.start > b.start ? -1 : 1))

  for (const imp of importList) {
    const importPath = imp.url
    if (!importPath || shouldReserveUrl(importPath)) continue
    // 非法路径直接跳过
    let resolvedUrl
    try {
      resolvedUrl = await resolve(importPath, fromParent)
    } catch (error) {
      continue
    }
    const content = (await load(resolvedUrl)) ?? ''
    css = css.slice(0, imp.start) + '\n' + content + '\n' + css.slice(imp.end)
  }

  return css
}
/**
 * @param {StripByPostcssOption} options
 */
async function stripByPostcss(options) {
  const defs = options.defs ?? {}

  function stripContentCondition(content) {
    content = stripCondition(content, defs)

    if (options.lang === 'stylus') {
      content = content.replace(/\t/g, '  ')
    }

    return content
  }

  /**
   * @type {string}
   */
  const afterConditionStrip = stripContentCondition(options.css, defs)

  const atImportOptions = {
    async load(filename) {
      let content = await fs.readFile(filename, 'utf-8')

      content = stripContentCondition(content, defs)

      return await atImport({
        ...atImportOptions,
        from: filename,
        css: content
      })
    },
    resolve: (id, base) => {
      return new Promise((resolve, reject) => {
        // 处理 ~ 开头的路径
        options.resolve(base, id.startsWith('~') && !id.startsWith('~/') ? loaderUtils.urlToRequest(id) : id, (err, res) => {
          if (err) return reject(err)
          if (typeof res !== 'string') {
            return reject(new Error(`[mpx-strip-conditional-loader]: Cannot resolve ${id} from ${base}`))
          }
          resolve(res)
        })
      })
    }
  }

  return {
    css: await atImport({
      ...atImportOptions,
      from: options.resourcePath,
      css: afterConditionStrip
    })
  }
}

const createResolver = (contetx, extensions) =>
  contetx.getResolve({ mainFiles: ['index'], extensions: [...extensions, '.css'], preferRelative: true })
const resolver = {
  stylus: contetx => createResolver(contetx, ['.styl']),
  scss: contetx => createResolver(contetx, ['.scss']),
  less: contetx => createResolver(contetx, ['.styl'])
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
  const { resourcePath, queryObj } = parseRequest(this.resource)

  const result = await stripByPostcss({
    lang: queryObj.lang,
    resourcePath,
    css,
    defs: mpx.defs,
    resolve: resolver[queryObj.lang] ? resolver[queryObj.lang](this) : this.resolve.bind(this)
  })

  callback(null, result.css, result.map)
}

module.exports.stripByPostcss = stripByPostcss
module.exports.stripCondition = stripCondition
