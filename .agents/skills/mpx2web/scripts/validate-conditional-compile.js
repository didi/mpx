#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const { blocks, dependency } = require('./source-parser')
const codeExtensions = new Set(['.mpx', '.vue', '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.htm'])
const styleExtensions = new Set(['.css', '.less', '.scss', '.sass', '.styl', '.stylus'])
const directivePattern = /@mpx-(?:if|elif|else|endif)\b/i

function validateSource (source, file = 'input.js') {
  const errors = []
  const report = (offset, message, directive = '') => errors.push({
    line: source.slice(0, offset).split(/\r?\n/).length, message, directive
  })
  function script (content, offset, lang, json) {
    const parser = dependency('@babel/parser', file)
    const options = { sourceType: 'unambiguous', plugins: ['jsx', ...(lang === 'ts' || lang === 'tsx' ? ['typescript'] : [])] }
    const ast = json ? parser.parseExpression(content, options) : parser.parse(content, options)
    for (const comment of ast.comments || []) {
      if (directivePattern.test(comment.value)) {
        report(offset + comment.start, '@mpx 条件注释只允许出现在 style 中', comment.value.trim())
      }
    }
  }
  function template (content, offset) {
    const compiler = dependency('vue/compiler-sfc', file)
    const { ast } = compiler.compileTemplate({
      source: '<div>' + content + '</div>',
      filename: file,
      compilerOptions: { comments: true, outputSourceRange: true }
    })
    const visited = new Set()
    function visit (node) {
      if (!node || visited.has(node)) return
      visited.add(node)
      if (node.isComment && directivePattern.test(node.text)) {
        report(Math.max(offset, offset + node.start - 5), '@mpx 条件注释只允许出现在 style 中', node.text.trim())
      }
      ;(node.children || []).forEach(visit)
      ;(node.ifConditions || []).forEach(condition => visit(condition.block))
    }
    visit(ast)
  }
  function style (content, offset) {
    if (!directivePattern.test(content)) return
    const root = dependency('postcss', file).parse(content, { from: file })
    const parser = dependency('@babel/parser', file)
    const stack = []
    root.walkComments(comment => {
      if (!directivePattern.test(comment.text)) return
      const pos = offset + comment.source.start.offset
      const match = comment.text.trim().match(/^@mpx-(if|elif|else|endif)\b([\s\S]*)$/)
      if (!match) { report(pos, '无法识别的条件注释', comment.text); return }
      const [, kind, rest] = match
      if (kind === 'if' || kind === 'elif') {
        try {
          if (!/^\([\s\S]*\)$/.test(rest.trim())) throw new Error('条件需放在括号中')
          parser.parseExpression(rest.trim())
        } catch (error) {
          report(pos, '无效的条件表达式：' + error.message, comment.text)
        }
      } else if (rest.trim()) {
        report(pos, '条件结束或 else 注释包含多余内容', comment.text)
      }
      if (kind === 'if') stack.push({ pos, elseSeen: false })
      else if (!stack.length) report(pos, '@mpx-' + kind + ' 没有对应的 @mpx-if')
      else if (kind === 'endif') stack.pop()
      else if (stack[stack.length - 1].elseSeen) report(pos, 'else 之后不能再有 elif 或 else')
      else if (kind === 'else') stack[stack.length - 1].elseSeen = true
    })
    stack.forEach(item => report(item.pos, '@mpx-if 缺少对应的 @mpx-endif'))
  }
  function inspect (content, offset, type, attrs = {}) {
    try {
      if (type === 'style') style(content, offset)
      else if (type === 'template') template(content, offset)
      else if (type === 'script') {
        if (attrs.src) return
        script(content, offset, attrs.lang, attrs.type === 'application/json' && attrs.name !== 'json')
      } else if (directivePattern.test(content)) {
        report(offset, '待验证：不支持的区块类型 ' + type)
      }
    } catch (error) {
      report(offset, '待验证：解析失败：' + error.message)
    }
  }
  const ext = path.extname(file).toLowerCase()
  try {
    if (ext === '.mpx' || ext === '.vue') {
      const parsed = blocks(source, file)
      parsed.blocks.forEach(block => inspect(block.content, block.start, block.type, block.attrs))
      template(parsed.remaining, 0)
    } else if (styleExtensions.has(ext)) inspect(source, 0, 'style')
    else if (ext === '.html' || ext === '.htm') inspect(source, 0, 'template')
    else script(source, 0, ext.slice(1), ext === '.json')
  } catch (error) {
    report(0, '待验证：解析失败：' + error.message)
  }
  return errors
}

function validateFile (file) {
  const resolved = path.resolve(file)
  try {
    const source = fs.readFileSync(resolved, 'utf8')
    return { file: resolved, errors: validateSource(source, resolved) }
  } catch (error) {
    return {
      file: resolved,
      errors: [{ line: 0, directive: '', message: `无法读取文件：${error.message}` }]
    }
  }
}

function collectFiles (inputs) {
  const files = []
  inputs.forEach(input => {
    const resolved = path.resolve(input)
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      files.push(resolved)
      return
    }
    fs.readdirSync(resolved, { withFileTypes: true }).forEach(entry => {
      const target = path.join(resolved, entry.name)
      if (entry.isDirectory()) {
        files.push(...collectFiles([target]))
      } else if (codeExtensions.has(path.extname(entry.name).toLowerCase()) ||
        styleExtensions.has(path.extname(entry.name).toLowerCase())) {
        files.push(target)
      }
    })
  })
  return files
}

function main () {
  const args = process.argv.slice(2)
  const json = args.includes('--json')
  const inputs = args.filter(arg => arg !== '--json')
  if (!inputs.length) {
    console.error('usage: validate-conditional-compile [--json] <file-or-directory>...')
    process.exit(2)
  }

  const results = collectFiles(inputs).map(validateFile)
  const payload = {
    success: results.every(result => result.errors.length === 0),
    checkedFiles: results.length,
    files: results
  }
  if (json) {
    console.log(JSON.stringify(payload, null, 2))
  } else {
    results.forEach(result => {
      result.errors.forEach(error => {
        console.error(`${result.file}:${error.line}: ${error.message} [${error.directive}]`)
      })
    })
    if (payload.success) console.log(`[ok] checked ${payload.checkedFiles} file(s)`)
  }
  process.exit(payload.success ? 0 : 1)
}

module.exports = validateFile
module.exports.validateFile = validateFile
module.exports.validateSource = validateSource

if (require.main === module) main()
