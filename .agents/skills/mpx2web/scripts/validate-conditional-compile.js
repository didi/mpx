#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const codeExtensions = new Set([
  '.mpx', '.vue', '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.htm'
])
const styleExtensions = new Set(['.css', '.less', '.scss', '.sass', '.styl', '.stylus'])
const directivePattern = /@mpx-(?:if|elif|else|endif)\b/i
const commentPattern = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|^[\t ]*\/\/[^\r\n]*/gm

function lineNumber (source, index) {
  return source.slice(0, index).split(/\r?\n/).length
}

function styleRanges (source, extension) {
  if (styleExtensions.has(extension)) return [[0, source.length]]
  if (extension !== '.mpx' && extension !== '.vue') return []
  return Array.from(source.matchAll(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi))
    .map(match => [match.index, match.index + match[0].length])
}

function validateSource (source, file = '<source>') {
  const extension = path.extname(file).toLowerCase()
  const ranges = styleRanges(source, extension)
  const errors = []
  const styleStacks = ranges.map(() => [])
  for (const match of source.matchAll(commentPattern)) {
    if (!directivePattern.test(match[0])) continue
    const rangeIndex = ranges.findIndex(
      range => match.index >= range[0] && match.index < range[1]
    )
    if (rangeIndex < 0) {
      errors.push({
        line: lineNumber(source, match.index),
        directive: match[0].split(/\r?\n/, 1)[0].trim(),
        message: (
          '@mpx 条件注释只允许出现在 style 中；模板请使用 @mode、wx:if 或属性@mode，' +
          '脚本请使用真实的 if (__mpx_mode__ ...)'
        )
      })
      continue
    }

    const stack = styleStacks[rangeIndex]
    for (const directive of match[0].matchAll(/@mpx-(if|elif|else|endif)\b/gi)) {
      const kind = directive[1].toLowerCase()
      const index = match.index + directive.index
      const line = lineNumber(source, index)
      if (kind === 'if') {
        stack.push({ line, elseSeen: false })
      } else if (kind === 'endif') {
        if (stack.length) {
          stack.pop()
        } else {
          errors.push({
            line,
            directive: '@mpx-endif',
            message: 'style 中的 @mpx-endif 没有对应的 @mpx-if'
          })
        }
      } else if (!stack.length) {
        errors.push({
          line,
          directive: `@mpx-${kind}`,
          message: `style 中的 @mpx-${kind} 没有对应的 @mpx-if`
        })
      } else if (kind === 'else') {
        if (stack[stack.length - 1].elseSeen) {
          errors.push({
            line,
            directive: '@mpx-else',
            message: '同一个 style 条件块中出现了重复的 @mpx-else'
          })
        }
        stack[stack.length - 1].elseSeen = true
      } else if (stack[stack.length - 1].elseSeen) {
        errors.push({
          line,
          directive: '@mpx-elif',
          message: 'style 中的 @mpx-elif 不能出现在 @mpx-else 之后'
        })
      }
    }
  }
  styleStacks.forEach(stack => {
    stack.forEach(entry => {
      errors.push({
        line: entry.line,
        directive: '@mpx-if',
        message: 'style 中的 @mpx-if 缺少对应的 @mpx-endif'
      })
    })
  })
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
