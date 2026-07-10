const { parseMustache, stringifyAttr } = require('@mpxjs/webpack-plugin/lib/template-compiler/compiler')
const { unescapeKey, mpUnescape } = require('@mpxjs/webpack-plugin/lib/template-compiler/trans-dynamic-class-expr')

function parseClasses (content) {
  const output = []
  if (!content) { return output }
  const regex = /class\s*=\s*"[^"]*"|class\s*=\s*'[^']*'/igm
  let match
  while (match = regex.exec(content)) {
    const raw = match[0]
    const sep = raw.indexOf('=')
    const value = raw.slice(sep + 1).trim().slice(1, -1)
    const end = regex.lastIndex - 2
    const start = regex.lastIndex - 1 - value.length
    output.push({
      result: value,
      start,
      end
    })
  }

  return output
}

function parseComments (content) {
  const output = []
  if (!content) { return output }
  const regex = /<!--(?:.|\n|\r)+?-->/gm
  let match
  while (match = regex.exec(content)) {
    const raw = match[0]
    const value = raw.slice(4, -3)
    const start = match.index
    const end = start + raw.length - 1
    output.push({
      result: value,
      start,
      end
    })
  }
  return output
}

function parseCommentConfig (content) {
  const result = {}
  if (!content) { return result }
  const regex = /mpx_config_(.+?)\s*:(.+)/
  content.split(/\n|\r/).forEach((item) => {
    const match = regex.exec(item)
    if (match) {
      const key = match[1]
      const raw = match[2]
      try {
        const value = JSON.parse(raw.replace(/'/g, '"'))
        result[key] = value
      } catch (e) {
      }
    }
  })
  return result
}

function parseStrings (content) {
  const output = []
  if (!content) { return output }
  const regex = /'[^']*'|"[^"]*"/gm
  let match
  while (match = regex.exec(content)) {
    const raw = match[0]
    const value = raw.slice(1, -1)
    const end = regex.lastIndex - 2
    const start = regex.lastIndex - 1 - value.length
    output.push({
      result: value,
      start,
      end
    })
  }
  return output
}

// 匹配对象字面量中标识符形式的 key，如 { ml_da_17rpxMpxEscape: flag, a: true }
// key 前面必须是 { 或 ,（加可选空格），后面是 :
const objKeyReg = /(?:[{,]\s*)([\w-]+?)(?=\s*:)/gm

function parseMpxEscapeKeys (content, escapeMap) {
  const output = []
  if (!content) { return output }
  let match
  objKeyReg.lastIndex = 0
  while (match = objKeyReg.exec(content)) {
    const raw = match[1]
    const end = match.index + match[0].length - 1
    const start = end - raw.length + 1
    output.push({
      result: mpUnescape(unescapeKey(raw), escapeMap),
      start,
      end
    })
  }
  return output
}

module.exports = {
  parseClasses,
  parseStrings,
  parseMpxEscapeKeys,
  parseComments,
  parseCommentConfig,
  parseMustache,
  stringifyAttr
}
