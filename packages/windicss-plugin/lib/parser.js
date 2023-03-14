const parse = require('@mpxjs/webpack-plugin/lib/template-compiler/compiler').parseMustache()

function parseClass (content) {
  const output = []
  if (!content) return output
  const regex = /class\s*=\s*"([^"]+)"|class\s*=\s*'([^']+)'/igm
  let match
  while (match = regex.exec(content)) {
    const raw = match[0]
    const sep = raw.indexOf('=')
    const value = raw.slice(sep + 1).trim().slice(1, -1)
    const end = regex.lastIndex - 1
    const start = end - value.length
    output.push({
      result: value,
      start,
      end,
      startChar: content.charAt(start),
      endChar: content.charAt(end)
    })
  }
}

module.exports = {
  parseClass
}
