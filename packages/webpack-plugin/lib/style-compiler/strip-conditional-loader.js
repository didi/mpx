const { default: postcss } = require('postcss')
const fs = require('fs/promises')
const atImport = require('postcss-import')
const parseRequest = require('../utils/parse-request')

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
  tokens.forEach((token) => {
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
        throw new Error('elif without a preceding if')
      }
      currentChildren = nodeStack[nodeStack.length - 1]
      const node = new Node('ElseIf', token.condition)
      currentChildren.push(node)
      currentChildren = node.children
    } else if (token.type === 'else') {
      if (nodeStack.length === 0) {
        throw new Error('else without a preceding if')
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
    const values = keys.map((key) => defs[key])
    /* eslint-disable no-new-func */
    const func = new Function(...keys, `return (${condition});`)
    return func(...values)
  } catch (e) {
    console.error(`Error evaluating condition: ${condition}`, e)
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
 * @param {Function} callback
 * @param {string} name
 * @returns
 */
const shouldInstallWarning = (callback, name) => {
  return () => {
    try {
      return callback()
    } catch (error) {
      throw new Error(
        `[mpx-strip-conditional-loader]: ${name} is not installed, please install it first.\norginal Error: ${
          error?.message ?? error.toString()
        }`,
        {
          cause: error
        }
      )
    }
  }
}
/**
 *
 * @typedef {import('postcss').ProcessOptions} ProcessOptions
 * @typedef {import('postcss').Root} Root
 *
 * @type {Record<string, ProcessOptions['syntax']>}
 */
const styleSyntaxProcesserMap = {
  stylus: shouldInstallWarning(() => require('postcss-styl'), 'postcss-styl'),
  less: shouldInstallWarning(() => require('postcss-less'), 'postcss-less'),
  scss: shouldInstallWarning(() => require('postcss-scss'), 'postcss-scss')
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
 * @property {string} css 源文件
 * @property {Record<string, any>} defs 条件定义
 * @property {import('webpack').LoaderContext<any>['resolve']} resolve webpack resolve 方法
 */

/**
 * @param {StripByPostcssOption} options
 */
async function stripByPostcss(options) {
  const syntax = styleSyntaxProcesserMap[options.lang]?.()
  const defs = options.defs ?? {}

  const afterConditionStrip = stripCondition(options.css, defs)

  const processer = postcss([
    atImport({
      async load(filename) {
        let content = await fs.readFile(filename, 'utf-8')
        const processer = postcss([])

        content = stripCondition(content, defs)

        const { css } = await processer.process(content, {
          syntax,
          from: filename,
          to: options.resourcePath
        })
        return css
      },
      resolve: (id, base) => {
        return new Promise((resolve, reject) => {
          options.resolve(base, id, (err, res) => {
            if (err) return reject(err)
            if (typeof res !== 'string') {
              return reject(
                new Error(
                  `[mpx-strip-conditional-loader]: Cannot resolve ${id} from ${base}`
                )
              )
            }
            resolve(res)
          })
        })
      }
    })
  ])

  return processer.process(afterConditionStrip, {
    from: options.resourcePath,
    syntax
  })
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
    resolve: this.resolve.bind(this)
  })

  for (const warning of result.warnings()) {
    this.emitWarning(warning)
  }

  // todo 后续考虑直接使用postcss-loader来处理postcss
  for (const message of result.messages) {
    // eslint-disable-next-line default-case
    switch (message.type) {
      case 'dependency':
        this.addDependency(message.file)
        break

      case 'build-dependency':
        this.addBuildDependency(message.file)
        break

      case 'missing-dependency':
        this.addMissingDependency(message.file)
        break

      case 'context-dependency':
        this.addContextDependency(message.file)
        break

      case 'dir-dependency':
        this.addContextDependency(message.dir)
        break

      case 'asset':
        if (message.content && message.file) {
          this.emitFile(
            message.file,
            message.content,
            message.sourceMap,
            message.info
          )
        }
    }
  }

  callback(null, result.css, result.map)
}

module.exports.stripByPostcss = stripByPostcss
module.exports.stripCondition = stripCondition
