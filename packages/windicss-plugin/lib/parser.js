const { parseMustache, stringifyAttr } = require('@mpxjs/webpack-plugin/lib/template-compiler/compiler')

function parseClasses (content) {
  const output = []
  if (!content) return output
  const regex = /class\s*=\s*"[^"]+"|class\s*=\s*'[^']+'/igm
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

function parseStrings (content) {
  const output = []
  if (!content) return output
  const regex = /'[^']+'|"[^"]+"/gm
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

function parseTags (content) {
  if (!content) return []
  return Array.from(new Set(content.match(/<\w+/g))).map((i) => i.substring(1))
}

module.exports = {
  parseClasses,
  parseStrings,
  parseTags,
  parseMustache,
  stringifyAttr,
}
