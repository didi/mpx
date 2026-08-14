#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const eventPattern = '(?:tap|longpress|touchstart|touchmove|touchend|touchcancel)'

function validateFile (file) {
  const source = fs.readFileSync(file, 'utf8')
  const modules = Array.from(source.matchAll(
    /<script\b[^>]*\bmodule\s*=\s*['"]([^'"]+)['"][^>]*\blang\s*=\s*['"]wxs['"][^>]*>/gi
  )).map(match => match[1])
  if (!modules.length) return []

  const modulePattern = modules.map(escapeRegExp).join('|')
  const plainScript = source.replace(
    /<script\b[^>]*\blang\s*=\s*['"]wxs['"][^>]*>[\s\S]*?<\/script>/gi,
    ''
  )
  const errors = []

  Array.from(source.matchAll(/<[a-z][^<>]*>/gi)).forEach(tagMatch => {
    const tag = tagMatch[0]
    const direct = new RegExp(
      `(?:bind|catch)(${eventPattern})\\s*=\\s*['"]\\{\\{\\s*(?:${modulePattern})\\.\\w+\\s*\\}\\}['"]`,
      'gi'
    )
    Array.from(tag.matchAll(direct)).forEach(match => {
      errors.push(`WXS ${match[1]} 事件仍直接绑定到 Web 可见模板`)
    })

    const unsuffixed = new RegExp(
      `(?:bind|catch)(${eventPattern})(?!@)\\s*=\\s*(['"])(?:(?!\\2).)*(?:${modulePattern})\\.\\w+(?:(?!\\2).)*\\2`,
      'gi'
    )
    Array.from(tag.matchAll(unsuffixed)).forEach(match => {
      errors.push(`WXS ${match[1]} 事件仍通过无平台后缀的动态表达式暴露给 Web`)
    })

    const wxOnly = new RegExp(
      `(?:bind|catch)(${eventPattern})@wx\\s*=\\s*['"]\\{\\{\\s*(?:${modulePattern})\\.\\w+\\s*\\}\\}['"]`,
      'gi'
    )
    Array.from(tag.matchAll(wxOnly)).forEach(match => {
      const event = match[1]
      const webBinding = tag.match(new RegExp(`@${event}@web\\s*=\\s*['"]([A-Za-z_$][\\w$]*)['"]`, 'i'))
      if (!webBinding) {
        errors.push(`@wx ${event} 缺少同节点 @${event}@web 绑定`)
        return
      }
      const handler = webBinding[1]
      if (!new RegExp(`\\b${escapeRegExp(handler)}\\s*\\(`).test(plainScript)) {
        errors.push(`Web 处理器 ${handler} 未在普通脚本中定义`)
      }
    })
  })

  return errors
}

function escapeRegExp (value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function main () {
  const files = process.argv.slice(2)
  if (!files.length) {
    console.error('usage: validate-wxs-web-events <file.mpx>...')
    process.exit(2)
  }

  let failed = false
  files.forEach(file => {
    const resolved = path.resolve(file)
    const errors = validateFile(resolved)
    errors.forEach(error => console.error(`${resolved}: ${error}`))
    failed = failed || errors.length > 0
  })
  process.exit(failed ? 1 : 0)
}

module.exports = validateFile

if (require.main === module) main()
