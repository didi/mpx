const fs = require('fs/promises')
const parseRequest = require('../utils/parse-request')
const path = require('path')
const loaderUtils = require('loader-utils')

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
 * @typedef {Object} StripByPostcssOption
 * @property {string} lang 样式语法格式
 * @property {string} resourcePath 文件路径
 * @property {string} root 根文件路径
 * @property {string} css 源文件
 * @property {Record<string, any>} defs 条件定义
 * @property {StyleLangContext!} langContext 语言相关上下文
 * @property {(resourcePath: string) => boolean} [filter] 过滤函数
 * @property {boolean} legacy 是否使用旧版条件编译
 */

/**
 * @typedef {Object} AtImportConfig
 * @property {string} css 样式内容
 * @property {string} from 当前文件路径
 * @property {string} root 根文件路径
 * @property {(filename: string) => Promise<string> | string} load 加载文件内容的函数
 * @property {(id: string, base: string) => Promise<string | null> | string | null} resolve 解析文件路径的函数
 * @property {(resourcePath: string) => boolean} filter
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

  const result = await Promise.all(
    importList.map(async imp => {
      const importPath = imp.url
      if (!importPath) return
      // 非法路径直接报错
      const resolvedUrl = await resolve(importPath, fromParent)
      const content = (await load(resolvedUrl)) ?? ''
      return {
        content,
        start: imp.start,
        end: imp.end,
        resolvedUrl
      }
    })
  )

  for (const res of result) {
    if (!res) continue
    css = css.slice(0, res.start) + '\n' + res.content + '\n' + css.slice(res.end)
  }

  return {
    css,
    imports: result.map(item => item.resolvedUrl)
  }
}
/**
 * @param {StripByPostcssOption} options
 */
async function stripByPostcss(options) {
  const defs = options.defs ?? {}

  if (options.legacy) {
    const afterConditionStrip = stripCondition(options.css, defs)
    return {
      css: afterConditionStrip
    }
  }

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
  const dependencies = []

  const atImportOptions = {
    async load(filename) {
      let content = fs.readFileSync(filename, 'utf-8')

      content = stripContentCondition(content, defs)

      const data = await atImport({
        ...atImportOptions,
        from: filename,
        css: content
      })
      dependencies.push(...data.imports)
      return data.css
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

  const result = await atImport({
    ...atImportOptions,
    from: options.resourcePath,
    css: afterConditionStrip
  })

  dependencies.push(...result.imports)

  return {
    css: result.css,
    dependencies
  }
}

const createResolver = (context, extensions) =>
  context.getResolve({ mainFiles: ['index'], extensions: [...extensions, '.css'], preferRelative: true })
const resolver = {
  stylus: context => createResolver(context, ['.styl']),
  scss: context => createResolver(context, ['.scss']),
  less: context => createResolver(context, ['.styl'])
}

/**
 * @typedef {Object} Options
 * @property {'before' | 'after'} stage 进行条件编译的时机
 * @property {boolean} [before=true] 是否在样式处理loader之前进行条件编译
 * @property {boolean} [after=true] 是否在样式处理loader之后进行条件编译
 * @property {(string | RegExp)[]} beforeExclude 在样式处理loader之前进行条件编译时排除的文件
 * @property {(string | RegExp)[]} afterExclude 在样式处理loader之后进行条件编译时排除的文件
 * @property {Record<string, any>} [defs] 全局条件定义
 * @property {boolean} [legacy=false]
 * @property {boolean} [beforeLegacy=false] scss-loader, less-loader, stylus-loader 等 loader 前置编译降级到旧版编译
 * @property {boolean} [afterLegacy=false] scss-loader, less-loader, stylus-loader 等 loader 后置编译降级到旧版编译
 *
 */

/**
 * @param {import('webpack').Compiler} compiler
 * @param {(string | RegExp)[]} exclude
 */
const createFilter = (compiler, exclude, include) => {
  const matcher = compiler.webpack.ModuleFilenameHelpers.matchObject.bind(undefined, { include, exclude })
  return resourcePath => matcher(resourcePath)
}
/**
 *
 * @this {import('webpack').LoaderContext<any>}
 * @param {string} css
 */
module.exports = async function (css) {
  /**
   * @type {Options}
   */
  const options = this.getOptions()
  this.cacheable()
  const filter = options.stage === 'before' ? createFilter(this._compiler, options.beforeExclude) : createFilter(this._compiler, options.afterExclude)
  let legacy = (options.stage === 'before' ? options.beforeLegacy : options.afterLegacy)
  if (legacy === undefined) {
    legacy = options.legacy === true
  }

  const callback = this.async()

  const mpx = this.getMpx()
  const { resourcePath, queryObj } = parseRequest(this.resource)

  if (!filter(resourcePath)) {
    return callback(null, css)
  }

  const result = await stripByPostcss({
    lang: queryObj.lang,
    resourcePath,
    css,
    defs: mpx.defs,
    resolve: resolver[queryObj.lang] ? resolver[queryObj.lang](this) : this.resolve.bind(this)
  })

  for (const dep of result.dependencies) {
    this.addDependency(path.normalize(dep))
  }

  callback(null, result.css, result.map)
}

module.exports.stripByPostcss = stripByPostcss
module.exports.stripCondition = stripCondition
